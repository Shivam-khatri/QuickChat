import {  createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children })=>{
    
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [pollingInterval, setPollingInterval] = useState(null);

    const{socket, axios} = useContext(AuthContext);

    // function to get all users for sidebar
    const getUsers = async()=>{
        try {
            const { data } = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    // function to get message for selected users
    const getMessages = async(userId)=>{
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    // function to send message to selected user
    const sendMessage = async(messageData)=>{
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages, data.newMessage])
            }
            else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    // function to subscribe to message for selected user (using polling instead of Socket.io)
    const subscribeToMessage = async() =>{
        // Poll for new messages every 2 seconds
        const interval = setInterval(async() => {
            try {
                const { data } = await axios.get("/api/messages/users");
                if(data.success){
                    setUnseenMessages(data.unseenMessages);
                    
                    // If a user is selected, fetch their messages to check for new ones
                    if(selectedUser){
                        const messagesData = await axios.get(`/api/messages/${selectedUser._id}`);
                        if(messagesData.data.success){
                            setMessages(messagesData.data.messages);
                        }
                    }
                }
            } catch (error) {
                console.error("Error polling messages:", error);
            }
        }, 2000);
        
        return interval;
    }
    
    // function to unsubscribe from messages
    const unsubscribeFromMessages = (interval) =>{
        if(interval) clearInterval(interval);
    }
    useEffect(()=>{
        const startPolling = async() => {
            const interval = await subscribeToMessage();
            setPollingInterval(interval);
        };
        startPolling();
        return ()=> {
            // Cleanup will happen in the next effect or component unmount
        }
    },[selectedUser])
    
    // Separate useEffect for cleanup to avoid stale closures
    useEffect(()=>{
        return ()=> {
            if(pollingInterval) clearInterval(pollingInterval);
        }
    },[pollingInterval])

    useEffect(()=>{
        if(selectedUser?._id){
            getMessages(selectedUser._id);
        }
    },[selectedUser])
    
    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    }
    return (
    <ChatContext.Provider value={value}>
        { children }
    </ChatContext.Provider>
    )
}