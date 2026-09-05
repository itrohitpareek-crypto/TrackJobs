import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";


const C =
  createContext(null);


export function AuthProvider({
  children,
}) {

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =======================================================
     INITIAL AUTH CHECK
  ======================================================= */

  useEffect(() => {

    const finishGoogleLogin =
      async () => {

        const params =
          new URLSearchParams(
            window.location.search
          );


        const googleSuccess =
          params.get(
            "google_success"
          );


        const googleToken =
          params.get(
            "token"
          );


        const googleError =
          params.get(
            "google_error"
          );


        if (googleError) {

          localStorage.setItem(
            "jt_google_error",
            googleError
          );


          window.history.replaceState(
            {},
            document.title,
            "/login"
          );
        }


        if (
          googleSuccess === "1" &&
          googleToken
        ) {

          localStorage.setItem(
            "jt_token",
            googleToken
          );


          // Remove token from
          // browser URL immediately.

          window.history.replaceState(
            {},
            document.title,
            "/login"
          );
        }


        const token =
          localStorage.getItem(
            "jt_token"
          );


        if (!token) {

          setLoading(false);

          return;
        }


        try {

          const response =
            await api.get(
              "/auth/me"
            );


          setUser(
            response.data.user
          );

        } catch (error) {

          console.error(
            "AUTH ME ERROR:",
            error
          );


          localStorage.removeItem(
            "jt_token"
          );


          setUser(null);

        } finally {

          setLoading(false);

        }
      };


    finishGoogleLogin();

  }, []);


  /* =======================================================
     LOGIN
  ======================================================= */

  const login =
    async (data) => {

      const response =
        await api.post(
          "/auth/login",
          data
        );


      const token =
        response.data.token;


      const loggedInUser =
        response.data.user;


      if (!token) {
        throw new Error(
          "Login token was not received."
        );
      }


      if (!loggedInUser) {
        throw new Error(
          "User information was not received."
        );
      }


      localStorage.setItem(
        "jt_token",
        token
      );


      setUser(
        loggedInUser
      );


      return loggedInUser;
    };


  /* =======================================================
     REGISTER
  ======================================================= */

  const register =
    async (data) => {

      const response =
        await api.post(
          "/auth/register",
          data
        );


      const token =
        response.data.token;


      const registeredUser =
        response.data.user;


      if (!token) {
        throw new Error(
          "Registration token was not received."
        );
      }


      if (!registeredUser) {
        throw new Error(
          "User information was not received."
        );
      }


      localStorage.setItem(
        "jt_token",
        token
      );


      setUser(
        registeredUser
      );


      return registeredUser;
    };


  /* =======================================================
     UPDATE USER
  ======================================================= */

  const updateUser =
    (updatedUser) => {

      if (!updatedUser) return;


      setUser(
        (currentUser) => ({
          ...(currentUser || {}),
          ...updatedUser,

          id:
            updatedUser.id ||
            updatedUser._id ||
            currentUser?.id ||
            currentUser?._id,
        })
      );
    };


  /* =======================================================
     REFRESH USER
  ======================================================= */

  const refreshUser =
    async () => {

      const response =
        await api.get(
          "/auth/me"
        );


      const freshUser =
        response.data?.user;


      if (freshUser) {
        setUser(
          freshUser
        );
      }


      return freshUser;
    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    () => {

      localStorage.removeItem(
        "jt_token"
      );


      setUser(null);
    };


  return (
    <C.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </C.Provider>
  );
}


export const useAuth =
  () => useContext(C);