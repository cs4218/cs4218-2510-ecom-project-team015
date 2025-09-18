import React from 'react';
import { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
//import { set } from "mongoose";
import Spinner from "../Spinner";

export default function PrivateRoute(){
    const [ok,setOk] = useState(false)
    const [auth,setAuth] = useAuth()

    // This useEffect hook sends api call to backend to check if 
    useEffect(()=> {
        const authCheck = async() => {
            try {
                const res = await axios.get("/api/v1/auth/user-auth");
                setOk(res.data.ok); //either true or false
            } catch (err) {
                console.error("Authentication check from backend failed: ", err.message);
                setOk(false);
            }
            
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}