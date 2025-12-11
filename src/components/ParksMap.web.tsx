import React from 'react';
import { View, Text } from 'react-native';

// Web fallback for ParksMap - maps are not supported on web
export const ParksMap = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
        Map view is not available on web. Please use the iOS or Android app for the full map experience.
      </Text>
    </View>
  );
};

export default ParksMap;
