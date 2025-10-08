import { useContext, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const useUserAuth = () =>{
    const { user, loading, clearUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() =>{
        if (loading) return;
        if (user) return;

        if (!user){
            clearUser();
            navigate("/login");
        }
    }, [user, loading, clearUser, navigate]);
}