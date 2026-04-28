import { StatusBar } from "expo-status-bar";
import React from "react";
import { EventProvider } from "../contexts/EventContext";
import AppNavigator from "../navigation/AppNavigator";

export default function App() {
  return (
    <EventProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </EventProvider>
  );
}

// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//     </View>
//   );
// }
