// import React from 'react'
// import { View, Text, TouchableOpacity } from 'react-native'
// import { MaterialCommunityIcons } from '@expo/vector-icons'
// import { Truck } from './types'

// interface SmallTruckCardProps {
//   truck: Truck
//   onBookPress: () => void
// }

// export const SmallTruckCard: React.FC<SmallTruckCardProps> = ({ truck, onBookPress }) => (
//   <View
//     className='bg-white m-2 overflow-hidden rounded-2xl p-4'
//     style={{
//       width: 280,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.8,
//       shadowRadius: 8,
//       elevation: 4,
//     }}
//   >
//     <View className='flex-row items-center justify-between mb-2'>
//       <View
//         className='w-16 h-16 rounded-full items-center justify-center'
//         style={{ backgroundColor: truck.iconBg }}
//       >
//         <MaterialCommunityIcons
//           name={truck.icon as any}
//           size={28}
//           color={truck.iconColor}
//         />
//       </View>
//       <View className='items-end bg-[#4CAF501A] px-4 py-2 rounded-full'>
//         <Text className='text-lg font-semibold text-primary'>
//           {truck.distance}
//         </Text>
//       </View>
//     </View>

//     <View className='flex-row justify-between'>
//       <Text className='text-lg font-bold text-gray-dark' numberOfLines={1}>
//         {truck.name}
//       </Text>
//       <Text className='text-lg text-gray-400 mb-1'>
//         {truck.capacity}
//       </Text>
//     </View>
    
//     <Text className='text-lg text-gray-medium mb-6' numberOfLines={2}>
//       {truck.description}
//     </Text>
    
//     <TouchableOpacity onPress={onBookPress} className='bg-primary py-3 rounded-xl'>
//       <Text className='text-white text-center font-bold text-xl'>
//         BOOK
//       </Text>
//     </TouchableOpacity>
//   </View>
// )