// UserScheduleShifting.tsx - Fixed version
import { Entypo } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useState, useEffect } from 'react'
import {
    ScrollView,
    StatusBar,
    Text,
  TextInput,
    TouchableOpacity,
    View,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useBooking } from '../../../../Auth/BookingContext'

const UserScheduleShifting = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const {
    pickupLocation,
    dropoffLocation,
    routeData,
    scheduleDate,
    scheduleTime,
    workNotes,
    selectedTruck,
    setScheduleDate,
    setScheduleTime,
    setWorkNotes
  } = useBooking()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(() => {
    if (scheduleDate) {
      return parseInt(scheduleDate.split('-')[2])
    }
    return new Date().getDate()
  })
  const [selectedTime, setSelectedTime] = useState(() => {
    if (scheduleTime) return scheduleTime
    const now = new Date()
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })
  const [localWorkNotes, setLocalWorkNotes] = useState(workNotes || '')

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const formatDateForAPI = () => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTimeForAPI = (time: string) => {
    const [timePart, period] = time.split(' ')
    const [hoursStr, minutes] = timePart.split(':')
    let h = parseInt(hoursStr, 10)
    if (period === 'PM' && h !== 12) h += 12
    else if (period === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${minutes}`
  }

  const handleProceed = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date for your booking')
      return
    }

    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time for your booking')
      return
    }

    const formattedDate = formatDateForAPI()
    const formattedTime = formatTimeForAPI(selectedTime)

    setScheduleDate(formattedDate)
    setScheduleTime(formattedTime)
    setWorkNotes(localWorkNotes)

    // Book Now: truck already pre-selected — skip truck selection
    // Start Booking: no truck selected yet — go to truck selection
    if (selectedTruck) {
      navigation.navigate('UserOrderDetails')
    } else {
      navigation.navigate('UserSelectTruck')
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const today = new Date()
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()

    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className='w-10 h-10' />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isCurrentMonth && day < today.getDate()
      const isSelected = day === selectedDate

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => !isPast && setSelectedDate(day)}
          disabled={isPast}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            isSelected ? 'bg-green-500' : ''
            } ${isPast ? 'opacity-30' : ''}`}
        >
          <Text
            className={`text-base font-semibold ${
              isSelected ? 'text-white' : 'text-gray-800'
            }`}
          >
            {day}
          </Text>
        </TouchableOpacity>
      )
    }

    return days
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <StatusBar barStyle='dark-content' />

      <View className='flex-row items-center justify-between bg-white px-5 py-4 border-b border-gray-200'>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo name='chevron-left' size={28} color='#000' />
        </TouchableOpacity>
        <Text className='text-2xl font-bold text-gray-800'>Schedule Shifting</Text>
        <View className='w-7' />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1 px-5 py-6'>
        {/* Calendar Card */}
        <View className='mb-6 rounded-2xl bg-white p-6 shadow-sm'>
          <View className='mb-6 flex-row items-center justify-between'>
            <Text className='text-lg font-bold text-gray-800'>
              {monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}
            </Text>
            <View className='flex-row gap-3'>
              <TouchableOpacity onPress={handlePrevMonth} className='h-8 w-8 items-center justify-center'>
                <Entypo name='chevron-left' size={20} color='#666' />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth} className='h-8 w-8 items-center justify-center'>
                <Entypo name='chevron-right' size={20} color='#666' />
              </TouchableOpacity>
            </View>
          </View>

          <View className='mb-4 flex-row justify-around'>
            {dayNames.map((day) => (
              <View key={day} className='w-10 items-center'>
                <Text className='text-sm font-semibold text-green-500'>{day}</Text>
              </View>
            ))}
          </View>

          <View className='gap-2'>
            {Array.from({ length: Math.ceil(renderCalendar().length / 7) }).map((_, weekIndex) => (
              <View key={weekIndex} className='flex-row justify-around'>
                {renderCalendar().slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <View key={dayIndex}>{day}</View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Pick Time Section */}
        <View className='mb-6'>
          <Text className='mb-4 text-lg font-bold text-gray-800'>Pick time</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-6'>
            <View className='flex-row gap-2'>
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    className={`rounded-2xl px-5 py-3 ${isSelected ? 'bg-green-500' : 'bg-white border border-gray-300'
                      }`}
                  >
                    <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          <View className='rounded-2xl bg-green-50 py-4 px-6 items-center'>
            <Text className='text-sm font-semibold text-gray-600 mb-2'>Selected Time</Text>
            <Text className='text-3xl font-bold text-green-600'>{selectedTime}</Text>
          </View>
        </View>

        {/* Work Notes Section */}
        <View className='mb-6'>
          <Text className='mb-3 text-lg font-bold text-gray-800'>Work Notes</Text>
          <View className='rounded-2xl border border-gray-300 bg-white p-4'>
            <TextInput
              value={localWorkNotes}
              onChangeText={setLocalWorkNotes}
              placeholder='Enter work notes (e.g., Deliver at warehouse 5, fragile items, etc.)'
              placeholderTextColor='#999'
              multiline
              numberOfLines={4}
              textAlignVertical='top'
              className='text-base h-28 text-gray-800'
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleProceed}
          activeOpacity={0.8}
          className='mb-8 rounded-2xl bg-green-500 py-4'
        >
          <Text className='text-center text-lg font-bold text-white'>PROCEED</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default UserScheduleShifting