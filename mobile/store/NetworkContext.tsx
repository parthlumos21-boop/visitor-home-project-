import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {!isConnected && (
        <View className="bg-red-500 pt-12 pb-2 px-4 z-50 absolute top-0 w-full shadow-md">
          <Text className="text-white text-center font-bold text-sm">
            No Internet Connection
          </Text>
        </View>
      )}
      <View style={{ flex: 1, marginTop: !isConnected ? 40 : 0 }}>
        {children}
      </View>
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
