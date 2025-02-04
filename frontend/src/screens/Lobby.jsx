import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [roomId, setRoomId] = useState("");  // Change room to roomId
  const [interest, setInterest] = useState("");
  const [name, setName] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      // Send roomId, interest, and name to the backend
      socket.emit("room:join", { roomId, interest, name });
    },
    [roomId, interest, name, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      console.log("User Data Stored in DB:", data);  // Log the data that is returned from the backend
      const { userId, interest, name } = data;
      navigate(`/room/${roomId}`);
    },
    [navigate, roomId]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div>
      <h1>Fill the Details</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <label htmlFor="interest">Interest</label>
        <input
          type="text"
          id="interest"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />
        <br />
        <label htmlFor="Id">Room ID</label> 
        <input
          type="text"
          id="roomId"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}  
        />
        <br />
        <button>Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;