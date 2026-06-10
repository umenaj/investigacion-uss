import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  StatusBar,
  TextInput,
  PermissionsAndroid,
  Platform,
  BackHandler,
  AppState,
  ScrollView,
  Linking,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

// IP PRINCIPAL
const API_URL = 'http://167.99.235.231/boton-panico/public/api';

// ==============================================
// PANTALLA DE LOGIN MONITOREADOR
// ==============================================
function LoginScreen({ onLogin }) {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!documento || !password) {
      Alert.alert('Error', 'Ingrese documento y contraseña');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/monitoreador/login`, {
        documento: documento,
        password: password
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('monitoreadorToken', response.data.token);
        await AsyncStorage.setItem('monitoreadorData', JSON.stringify(response.data.user));
        onLogin(response.data.user);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Botón de Pánico</Text>
        <Text style={styles.subtitle}>Monitoreador</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Número de Documento"
          placeholderTextColor="#999"
          value={documento}
          onChangeText={setDocumento}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Ingresar</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==============================================
// PANTALLA DE BÚSQUEDA DE VÍCTIMA
// ==============================================
function BuscarScreen({ user, onLogout, onVictimaSeleccionada }) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [ultimasBusquedas, setUltimasBusquedas] = useState([]);

  useEffect(() => {
    cargarUltimasBusquedas();
  }, []);

  const cargarUltimasBusquedas = async () => {
    const busquedas = await AsyncStorage.getItem('ultimasBusquedas');
    if (busquedas) {
      setUltimasBusquedas(JSON.parse(busquedas));
    }
  };

  const guardarBusqueda = async (victima) => {
    const nuevas = [victima, ...ultimasBusquedas.filter(v => v.documento !== victima.documento)].slice(0, 5);
    setUltimasBusquedas(nuevas);
    await AsyncStorage.setItem('ultimasBusquedas', JSON.stringify(nuevas));
  };

  const buscarVictima = async () => {
    if (!dni.trim()) {
      Alert.alert('Error', 'Ingrese un DNI');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('monitoreadorToken');
      const response = await axios.get(`${API_URL}/monitoreador/victima/${dni}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await guardarBusqueda(response.data.victima);
        onVictimaSeleccionada(response.data.victima, response.data.alerta_activa);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Víctima no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarBusqueda = (victima) => {
    setDni(victima.documento);
    setTimeout(() => buscarVictima(), 100);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('monitoreadorToken');
    await AsyncStorage.removeItem('monitoreadorData');
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitoreador</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buscarContainer}>
        <Text style={styles.buscarTitle}>Buscar Víctima</Text>
        
        <TextInput
          style={styles.buscarInput}
          placeholder="Ingrese DNI de la víctima"
          placeholderTextColor="#999"
          value={dni}
          onChangeText={setDni}
          keyboardType="numeric"
        />
        
        <TouchableOpacity style={styles.buscarButton} onPress={buscarVictima} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buscarButtonText}>Buscar</Text>}
        </TouchableOpacity>
        
        {ultimasBusquedas.length > 0 && (
          <ScrollView style={styles.ultimasBusquedas}>
            <Text style={styles.ultimasBusquedasTitle}>Últimas búsquedas</Text>
            {ultimasBusquedas.map((victima, index) => (
              <TouchableOpacity
                key={index}
                style={styles.busquedaItem}
                onPress={() => seleccionarBusqueda(victima)}
              >
                <Text style={styles.busquedaItemDni}>{victima.documento}</Text>
                <Text style={styles.busquedaItemNombre}>{victima.nombres} {victima.primer_apellido}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==============================================
// PANTALLA DE DETALLE DE VÍCTIMA
// ==============================================
function DetalleScreen({ victima, alertaActiva, onBack }) {
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [ubicacionVictima, setUbicacionVictima] = useState(alertaActiva);
  const [loading, setLoading] = useState(true);
  const [tiempoActualizacion, setTiempoActualizacion] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    obtenerUbicacionActual();
    
    intervalRef.current = setInterval(() => {
      actualizarUbicacionVictima();
    }, 5000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const obtenerUbicacionActual = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message: 'La app necesita acceder a tu ubicación para monitorear a las víctimas',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar'
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Error', 'No se puede usar la app sin permiso de ubicación');
          setLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          console.log('Error de geolocalización:', error);
          Alert.alert('Error de Ubicación', 'No se pudo obtener tu ubicación. Activa el GPS.');
          setLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'No se pudo solicitar permiso de ubicación');
      setLoading(false);
    }
  };

  const actualizarUbicacionVictima = async () => {
    try {
      const token = await AsyncStorage.getItem('monitoreadorToken');
      const response = await axios.get(`${API_URL}/monitoreador/ubicacion/${victima.victima_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.tiene_alerta) {
        setUbicacionVictima({
          latitud: response.data.latitud,
          longitud: response.data.longitud,
          ultima_emision: response.data.ultima_emision,
          estado: response.data.estado
        });
        setTiempoActualizacion(response.data.tiempo_transcurrido);
      }
    } catch (error) {
      console.log('Error actualizando ubicación:', error);
    }
  };

  const abrirGoogleMaps = () => {
    if (!ubicacionActual || !ubicacionVictima) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${ubicacionActual.latitude},${ubicacionActual.longitude}&destination=${ubicacionVictima.latitud},${ubicacionVictima.longitud}&travelmode=driving`;
    Linking.openURL(url);
  };

  const llamarVictima = () => {
    if (victima.telefono) {
      Linking.openURL(`tel:${victima.telefono}`);
    } else {
      Alert.alert('Error', 'La víctima no tiene teléfono registrado');
    }
  };

  const compartirUbicacion = () => {
    if (!ubicacionVictima) return;
    const mensaje = `🚨 ALERTA DE PÁNICO\nVíctima: ${victima.nombres} ${victima.primer_apellido}\nDNI: ${victima.documento}\nTeléfono: ${victima.telefono}\nUbicación: https://maps.google.com/?q=${ubicacionVictima.latitud},${ubicacionVictima.longitud}\n\n¡Se requiere asistencia inmediata!`;
    Share.share({ message: mensaje });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  const tieneUbicacionVictima = ubicacionVictima && ubicacionVictima.latitud && ubicacionVictima.longitud;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{victima.documento}</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <ScrollView style={styles.detalleContainer}>
        {/* Información de la víctima */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>👤 DATOS DE LA VÍCTIMA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{victima.nombres} {victima.primer_apellido} {victima.segundo_apellido || ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DNI:</Text>
            <Text style={styles.infoValue}>{victima.documento}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{victima.telefono || 'No registrado'}</Text>
          </View>
        </View>
        
        {/* Ubicación en tiempo real */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📍 UBICACIÓN EN TIEMPO REAL</Text>
          
          {tieneUbicacionVictima ? (
            <>
              <View style={styles.estadoBadge}>
                <Text style={[styles.estadoText, styles.estadoPendiente]}>
                  {ubicacionVictima.estado || 'PENDIENTE'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Latitud:</Text>
                <Text style={styles.infoValue}>{ubicacionVictima.latitud}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Longitud:</Text>
                <Text style={styles.infoValue}>{ubicacionVictima.longitud}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Actualización:</Text>
                <Text style={styles.infoValue}>Hace {tiempoActualizacion} segundos</Text>
              </View>
            </>
          ) : (
            <View style={styles.sinUbicacionContainer}>
              <Text style={styles.sinUbicacionText}>📍 Sin alerta activa</Text>
              <Text style={styles.sinUbicacionSubtext}>Esta víctima no tiene una alerta de pánico activa en este momento</Text>
            </View>
          )}
          
          {ubicacionActual && (
            <View style={styles.tuUbicacion}>
              <Text style={styles.tuUbicacionTitle}>📱 Tu ubicación actual:</Text>
              <Text style={styles.tuUbicacionText}>{ubicacionActual.latitude}, {ubicacionActual.longitude}</Text>
            </View>
          )}
        </View>
        
        {/* Botones de acción */}
        <View style={styles.botonesContainer}>
          {tieneUbicacionVictima && (
            <TouchableOpacity style={styles.botonRuta} onPress={abrirGoogleMaps}>
              <Text style={styles.botonRutaText}>📍 Cómo llegar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.botonLlamar} onPress={llamarVictima}>
            <Text style={styles.botonLlamarText}>📞 Llamar</Text>
          </TouchableOpacity>
          {/* /*{tieneUbicacionVictima && ( */}
            {/* <TouchableOpacity style={styles.botonCompartir} onPress={compartirUbicacion}> */}
              {/* <Text style={styles.botonCompartirText}>📤 Compartir</Text> */}
            {/* </TouchableOpacity> */}
          {/* )} */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==============================================
// COMPONENTE PRINCIPAL APP
// ==============================================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [victimaSeleccionada, setVictimaSeleccionada] = useState(null);
  const [alertaData, setAlertaData] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('monitoreadorToken');
      const userData = await AsyncStorage.getItem('monitoreadorData');
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log('Error checking login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setVictimaSeleccionada(null);
    setAlertaData(null);
  };

  const handleVictimaSeleccionada = (victima, alerta) => {
    setVictimaSeleccionada(victima);
    setAlertaData(alerta);
  };

  const handleBack = () => {
    setVictimaSeleccionada(null);
    setAlertaData(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (victimaSeleccionada) {
    return (
      <DetalleScreen 
        victima={victimaSeleccionada}
        alertaActiva={alertaData}
        onBack={handleBack}
      />
    );
  }

  return (
    <BuscarScreen 
      user={user}
      onLogout={handleLogout}
      onVictimaSeleccionada={handleVictimaSeleccionada}
    />
  );
}

// ==============================================
// ESTILOS
// ==============================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  
  header: { 
    backgroundColor: '#8B0000', 
    padding: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  logoutText: { 
    color: 'white', 
    fontSize: 14 
  },
  backText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  
  loginContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#8B0000', 
    textAlign: 'center', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 40 
  },
  input: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  button: { 
    backgroundColor: '#8B0000', 
    borderRadius: 10, 
    padding: 15, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  
  buscarContainer: { 
    flex: 1, 
    padding: 20 
  },
  buscarTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    textAlign: 'center', 
    marginBottom: 30 
  },
  buscarInput: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    fontSize: 16 
  },
  buscarButton: { 
    backgroundColor: '#8B0000', 
    borderRadius: 10, 
    padding: 15, 
    alignItems: 'center' 
  },
  buscarButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  
  ultimasBusquedas: { 
    marginTop: 30,
    maxHeight: 300,
  },
  ultimasBusquedasTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#666', 
    marginBottom: 10 
  },
  busquedaItem: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  busquedaItemDni: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  busquedaItemNombre: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 5 
  },
  
  detalleContainer: { 
    flex: 1, 
    padding: 15 
  },
  infoCard: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#8B0000', 
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  infoLabel: { 
    fontSize: 14, 
    color: '#666', 
    fontWeight: 'bold',
    width: '35%',
  },
  infoValue: { 
    fontSize: 14, 
    color: '#333',
    width: '60%',
    textAlign: 'right',
  },
  estadoBadge: { 
    alignItems: 'center', 
    marginBottom: 15 
  },
  estadoText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20,
    overflow: 'hidden',
  },
  estadoPendiente: { 
    backgroundColor: '#FF9800', 
    color: 'white' 
  },
  tuUbicacion: { 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  tuUbicacionTitle: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 5 
  },
  tuUbicacionText: { 
    fontSize: 12, 
    color: '#999' 
  },
  
  sinUbicacionContainer: { 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  sinUbicacionText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#666', 
    textAlign: 'center' 
  },
  sinUbicacionSubtext: { 
    fontSize: 12, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 10 
  },
  
  botonesContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    marginBottom: 20,
    gap: 10,
  },
  botonRuta: { 
    flex: 1, 
    backgroundColor: '#2196F3', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonRutaText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  botonLlamar: { 
    flex: 1, 
    backgroundColor: '#4CAF50', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonLlamarText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  botonCompartir: { 
    flex: 1, 
    backgroundColor: '#9C27B0', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonCompartirText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
});