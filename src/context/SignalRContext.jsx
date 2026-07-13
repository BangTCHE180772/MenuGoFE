import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const connect = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5067/notificationHub')
      .withAutomaticReconnect()
      .build();

    connect.start()
      .then(() => {
        console.log('Connected to SignalR Hub');
      })
      .catch((err) => {
        console.error('SignalR Connection Error: ', err);
      });

    setConnection(connect);

    return () => {
      connect.stop();
    };
  }, []);

  return (
    <SignalRContext.Provider value={connection}>
      {children}
    </SignalRContext.Provider>
  );
};
