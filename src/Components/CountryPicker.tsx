import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import countryData from '../../assets/country.json';

const { height } = Dimensions.get('window');

interface Country {
    name: string;
    code: string;
    iso: string;
    flag: string;
}

interface CountryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
    selectedCountry?: Country;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
    visible,
    onClose,
    onSelect,
    selectedCountry,
}) => {
    const [search, setSearch] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<Country[]>(countryData);
    const animationDriver = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(animationDriver, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animationDriver, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredCountries(countryData);
        } else {
            const filtered = countryData.filter(country =>
                country.name.toLowerCase().includes(search.toLowerCase()) ||
                country.code.includes(search) ||
                country.iso.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredCountries(filtered);
        }
    }, [search]);

    const modalPosition = animationDriver.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0],
        extrapolate: 'clamp',
    });

    const modalBackdropFade = animationDriver.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp'
    });

    const handleSelect = (country: Country) => {
        onSelect(country);
        onClose();
    };

    const renderItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                selectedCountry?.code === item.code && styles.selectedCountryItem
            ]}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.flagText}>{item.flag}</Text>
            <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
            </View>
            {selectedCountry?.code === item.code && (
                <Text style={styles.checkmark}>✓</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[
                        styles.backdrop,
                        { opacity: modalBackdropFade }
                    ]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[
                    styles.modal,
                    { transform: [{ translateY: modalPosition }] }
                ]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Country</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search country..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <FlatList
                        data={filteredCountries}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.iso}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No countries found</Text>
                            </View>
                        }
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: height * 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
        padding: 4,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#000',
    },
    list: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedCountryItem: {
        backgroundColor: '#e3f2fd',
    },
    flagText: {
        fontSize: 24,
        marginRight: 12,
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: 16,
        color: '#000',
        marginBottom: 2,
    },
    countryCode: {
        fontSize: 14,
        color: '#666',
    },
    checkmark: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
});