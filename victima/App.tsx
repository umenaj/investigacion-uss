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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

// IP GENERAL
const API_URL = 'http://167.99.235.231/boton-panico/public/api';

// ==============================================
// PANTALLA DE LOGIN
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
    
    console.log('📤 Intentando login con:', { documento, password });
    
    try {
      const response = await axios({
        method: 'post',
        url: `${API_URL}/movil/login`,
        data: {
          documento: documento,
          password: password
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Login exitoso:', response.data);
      
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('sessionActive', 'true');
        onLogin(response.data.user);
      } else {
        Alert.alert('Error', 'No se recibió token de autenticación');
      }
    } catch (error) {
      // console.log('❌ Error:', error.response?.data);
      
      let mensajeError = 'Credenciales inválidas';
      if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        mensajeError = 'Tiempo de espera agotado. Verifica la conexión.';
      } else if (error.message === 'Network Error') {
        mensajeError = 'Error de red. ¿El backend está corriendo?';
      }
      
      Alert.alert('Error', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Sistema Botón de Pánico</Text>
        <Text style={styles.subtitle}>Aplicativo Víctima</Text>
        
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
// PANTALLA DE ALERTA ACTIVA - CON MOVIMIENTO (5 METROS)
// ==============================================
function AlertaActivaScreen({ alertaId, estadoAlerta, user, onAlertaFinalizada }) {
  const [ultimaUbicacion, setUltimaUbicacion] = useState(null);
  const [estadoActual, setEstadoActual] = useState(estadoAlerta);
  const [verificando, setVerificando] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const estadoIntervalRef = useRef(null);
  const estaActiva = useRef(true);
  const contadorEnvio = useRef(0);
  const ultimaPosicionEnviada = useRef(null);

  // Función para calcular distancia entre dos puntos (Haversine)
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Función para enviar ubicación al servidor
  const sendLocationToServer = async (latitude, longitude, accuracy) => {
    if (!estaActiva.current) {
      console.log('⚠️ Alerta ya no está activa, no se envía ubicación');
      return false;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No hay token de autenticación');
        return false;
      }
      
      console.log(`📤 Enviando ubicación #${contadorEnvio.current + 1}: ${latitude}, ${longitude}`);
      
      const response = await axios.post(`${API_URL}/movil/ubicacion`, {
        alerta_id: alertaId,
        latitud: latitude,
        longitud: longitude,
        precision: accuracy || 10
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      contadorEnvio.current++;
      console.log(`✅ [ENVÍO #${contadorEnvio.current}] Ubicación enviada con éxito`);
      
      setUltimaUbicacion({ latitude, longitude, timestamp: new Date() });
      ultimaPosicionEnviada.current = { latitude, longitude };
      return true;
    } catch (error) {
      console.log('❌ Error al enviar ubicación:', error.message);
      return false;
    }
  };

  // Enviar ubicación solo si se movió más de 5 metros
  const enviarSiHayMovimiento = async (latitude, longitude, accuracy) => {
    if (!estaActiva.current) return;
    
    // Calcular distancia desde la última ubicación enviada
    if (ultimaPosicionEnviada.current) {
      const distancia = calcularDistancia(
        ultimaPosicionEnviada.current.latitude,
        ultimaPosicionEnviada.current.longitude,
        latitude,
        longitude
      );
      
      console.log(`📏 Distancia desde última ubicación: ${distancia.toFixed(2)} metros`);
      
      if (distancia < 5) {
        console.log(`⏭️ Movimiento menor a 5 metros (${distancia.toFixed(2)}m), no se envía`);
        return;
      }
      
      console.log(`🏃 Movimiento de ${distancia.toFixed(2)} metros detectado! Enviando ubicación...`);
    } else {
      console.log(`📍 Primera ubicación, enviando...`);
    }
    
    // Enviar la ubicación
    await sendLocationToServer(latitude, longitude, accuracy);
  };

  // Iniciar watchPosition para seguimiento continuo (funciona en segundo plano)
  const iniciarWatchPosition = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }
    
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 [WATCH] Posición detectada: ${latitude}, ${longitude} (precisión: ${accuracy}m)`);
        enviarSiHayMovimiento(latitude, longitude, accuracy);
      },
      (error) => {
        console.log('❌ WatchPosition error:', error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,        // Detectar cambios de 5 metros
        interval: 60000,           // Revisar cada 2 segundos
        fastestInterval: 60000,
        showsBackgroundLocationIndicator: true
      }
    );
  };

  // Obtener ubicación actual (para respaldo)
  const getAndSendLocation = async () => {
    if (!estaActiva.current) return;
    
    console.log(`📡 [${new Date().toLocaleTimeString()}] Obteniendo ubicación de respaldo...`);
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Ubicación obtenida: ${latitude}, ${longitude}`);
        await enviarSiHayMovimiento(latitude, longitude, accuracy);
      },
      async (error) => {
        console.log('❌ Error obteniendo ubicación:', error.code, error.message);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Verificar estado de alerta 
  const verificarEstadoAlerta = async () => {
    if (verificando || !estaActiva.current) return;
    
    setVerificando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No hay token para verificar estado');
        setVerificando(false);
        return;
      }
      
      console.log('🔍 Verificando estado de alerta...');
      const response = await axios.get(`${API_URL}/movil/alerta/activa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.alerta_id || 
          response.data.estado === 'ATENDIDA' || 
          response.data.estado === 'CERRADA' ||
          response.data.estado === 'FINALIZADA') {
        
        console.log('✅ Alerta finalizada, liberando app');
        estaActiva.current = false;
        
        await AsyncStorage.removeItem('alertaActiva');
        await AsyncStorage.removeItem('alertaId');
        await AsyncStorage.removeItem('alertaEstado');
        
        if (watchIdRef.current !== null) {
          Geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (estadoIntervalRef.current) clearInterval(estadoIntervalRef.current);
        
        onAlertaFinalizada();
        
        Alert.alert(
          '✅ Alerta Atendida',
          'Su alerta ha sido atendida por las autoridades.',
          [{ text: 'OK' }]
        );
      } else if (response.data.estado !== estadoActual) {
        setEstadoActual(response.data.estado);
        await AsyncStorage.setItem('alertaEstado', response.data.estado);
      }
    } catch (error) {
      console.log('❌ Error verificando estado:', error.message);
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    // console.log('🚀 ========================================');
    // console.log('🚀 INICIANDO SERVICIO DE UBICACIÓN');
    // console.log(`🚀 CODIGO ALERTA: ${alertaId}`);
    // console.log(`🚀 Distancia mínima para enviar: 5 METROS`);
    // console.log('🚀 ========================================');
    
    estaActiva.current = true;
    contadorEnvio.current = 0;
    ultimaPosicionEnviada.current = null;
    
    // Solicitar permisos de ubicación en segundo plano
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const fineLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permiso de Ubicación',
              message: 'La app necesita acceso a tu ubicación para enviar alertas de pánico',
              buttonNeutral: 'Preguntar después',
              buttonNegative: 'Cancelar',
              buttonPositive: 'Aceptar'
            }
          );
          
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Ubicación en segundo plano',
              message: 'La app necesita tu ubicación incluso con pantalla apagada',
              buttonNeutral: 'Preguntar después',
              buttonNegative: 'Cancelar',
              buttonPositive: 'Aceptar'
            }
          );
          console.log('✅ Permisos de ubicación:', { fineLocation, backgroundLocation });
        } catch (err) {
          console.warn('❌ Error solicitando permisos:', err);
        }
      }
    };
    requestPermissions();
    
    // Enviar ubicación inicial
    setTimeout(() => {
      console.log('📍 Enviando ubicación inicial...');
      getAndSendLocation();
    }, 2000);
    
    // Iniciar watchPosition para seguimiento continuo (funciona en segundo plano)
    iniciarWatchPosition();
    
    // Intervalo de respaldo cada 30 segundos 
    intervalRef.current = setInterval(() => {
      console.log(`🕐 Envío de respaldo (cada 30 segundos)`);
      getAndSendLocation();
    }, 60000);
    
    // Verificar estado cada 30 segundos
    estadoIntervalRef.current = setInterval(() => {
      verificarEstadoAlerta();
    }, 60000);
    
    // Prevenir salida con botón atrás
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Alerta Activa', 'No puedes salir de la app mientras tengas una alerta activa');
      return true;
    });
    
    return () => {
      console.log('🛑 DETENIENDO SERVICIO DE UBICACIÓN');
      console.log(`🛑 Total de envíos realizados: ${contadorEnvio.current}`);
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (estadoIntervalRef.current) clearInterval(estadoIntervalRef.current);
      backHandler.remove();
    };
  }, [alertaId]);

  const getLastLocationTime = () => {
    if (!ultimaUbicacion) return 'Esperando primera ubicación...';
    const segundos = Math.floor((new Date() - ultimaUbicacion.timestamp) / 1000);
    return `Última actualización: hace ${segundos} segundos`;
  };

  const getEstadoColor = () => {
    switch(estadoActual) {
      case 'PENDIENTE': return '#FF9800';
      case 'EN_ATENCION': return '#2196F3';
      case 'ATENDIDA': return '#4CAF50';
      default: return '#FF9800';
    }
  };

  const getEstadoTexto = () => {
    switch(estadoActual) {
      case 'PENDIENTE': return 'PENDIENTE - Esperando atención';
      case 'EN_ATENCION': return 'EN ATENCIÓN - Unidad asignada';
      case 'ATENDIDA': return 'ATENDIDA - Alerta finalizada';
      default: return estadoActual || 'PENDIENTE';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 ALERTA DE PÁNICO ACTIVA</Text>
      </View>
      
      <View style={styles.alertaActivaFullContainer}>
        <View style={styles.alertaCard}>
          <Text style={styles.alertaIcon}>🚨</Text>
          <Text style={styles.alertaTitle}>ALERTA ACTIVADA</Text>
          <Text style={styles.alertaId}>CODIGO ALERTA: {alertaId}</Text>
          <Text style={[styles.alertaEstado, { color: getEstadoColor() }]}>
            {getEstadoTexto()}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.ubicacionTitle}>📡 Enviando ubicación</Text>
          <Text style={styles.ubicacionText}>{getLastLocationTime()}</Text>
          {ultimaUbicacion && (
            <Text style={styles.ubicacionCoords}>
              📍 {ultimaUbicacion.latitude?.toFixed(6)}, {ultimaUbicacion.longitude?.toFixed(6)}
            </Text>
          )}
          
          <Text style={styles.contadorText}>
            📊 Envíos realizados: {contadorEnvio.current}
          </Text>
          
          <ActivityIndicator size="large" color="#8B0000" style={styles.loader} />
          
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ IMPORTANTE ⚠️
            </Text>
            <Text style={styles.warningSubtext}>
              • La ubicación se envía automáticamente
              • Estado actual: {estadoActual}
              • Cuando la alerta sea atendida, podrás usar la app nuevamente
            </Text>
          </View>
          
          {verificando && (
            <Text style={styles.verificandoText}>Verificando estado...</Text>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {user?.name} | {user?.documento}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ==============================================
// PANTALLA PRINCIPAL (SIN ALERTA)
// ==============================================
function HomeScreen({ user, onAlertaActivada }) {
  const [loading, setLoading] = useState(false);

  const solicitarPermisosUbicacion = async () => {
    if (Platform.OS === 'android') {
      try {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message: 'La app necesita acceso a tu ubicación para enviar alertas de pánico',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar'
          }
        );
        
        const backgroundLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Ubicación en segundo plano',
            message: 'Para mantener el seguimiento cuando la pantalla está apagada',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar'
          }
        );
        
        return fineLocation === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const activarAlerta = async () => {
    const tienePermiso = await solicitarPermisosUbicacion();
    if (!tienePermiso) {
      Alert.alert('Error', 'Se necesita permiso de ubicación');
      return;
    }

    Alert.alert(
      '🚨 ACTIVAR ALERTA DE PÁNICO',
      '¿Está absolutamente seguro?\n\nUna vez activada, NO podrá cerrar sesión ni salir de la app hasta que la alerta sea atendida por las autoridades.\n\nSolo eliminando la aplicación podrá salir.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'ACTIVAR ALERTA',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            
            Alert.alert('Activando', 'Obteniendo ubicación...');
            
            Geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                
                try {
                  const response = await axios.post(`${API_URL}/movil/alerta`, {
                    latitud: latitude,
                    longitud: longitude,
                    precision: accuracy
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  setLoading(false);
                  
                  if (response.data.success) {
                    await AsyncStorage.setItem('alertaActiva', 'true');
                    await AsyncStorage.setItem('alertaId', response.data.alerta_id.toString());
                    await AsyncStorage.setItem('alertaEstado', 'PENDIENTE');
                    
                    onAlertaActivada(response.data.alerta_id, 'PENDIENTE');
                  }
                } catch (error) {
                  setLoading(false);
                  Alert.alert('Error', error.response?.data?.error || 'No se pudo activar la alerta');
                }
              },
              (error) => {
                setLoading(false);
                Alert.alert('Error', 'No se pudo obtener su ubicación. Active el GPS.');
              },
              { enableHighAccuracy: true, timeout: 15000 }
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Activando alerta...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Botón de Pánico</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userDoc}>Documento: {user?.documento}</Text>
        </View>
        
        <TouchableOpacity style={styles.botonPanico} onPress={activarAlerta}>
          <Text style={styles.botonPanicoText}>¡ACTIVAR ALERTA!</Text>
          <Text style={styles.botonPanicoSubtext}>Botón de Pánico</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          Al presionar este botón, se enviará tu ubicación a las autoridades correspondientes.
          {'\n\n'}
          ⚠️ Ubicate en un lugar seguro y ten siempre el celular encendido con el aplicativo abierto.
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Versión 1.0 - Sistema Botón de Pánico</Text>
      </View>
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
  const [alertaActiva, setAlertaActiva] = useState(false);
  const [alertaId, setAlertaId] = useState(null);
  const [alertaEstado, setAlertaEstado] = useState(null);

  useEffect(() => {
    checkSession();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active' && alertaActiva) {
      await verificarEstadoAlertaDirecto();
    }
  };

  const verificarEstadoAlertaDirecto = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/movil/alerta/activa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.alerta_id || 
          response.data.estado === 'ATENDIDA' || 
          response.data.estado === 'CERRADA') {
        
        await AsyncStorage.removeItem('alertaActiva');
        await AsyncStorage.removeItem('alertaId');
        await AsyncStorage.removeItem('alertaEstado');
        setAlertaActiva(false);
        setAlertaId(null);
        setAlertaEstado(null);
      }
    } catch (error) {
      console.log('Error verificando estado');
    }
  };

  const checkSession = async () => {
    try {
      const sessionActive = await AsyncStorage.getItem('sessionActive');
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const alertaGuardada = await AsyncStorage.getItem('alertaActiva');
      const alertaIdGuardada = await AsyncStorage.getItem('alertaId');
      const alertaEstadoGuardado = await AsyncStorage.getItem('alertaEstado');
      
      if (sessionActive === 'true' && token && userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
        
        if (alertaGuardada === 'true' && alertaIdGuardada) {
          try {
            const response = await axios.get(`${API_URL}/movil/alerta/activa`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.alerta_id && 
                response.data.estado !== 'ATENDIDA' && 
                response.data.estado !== 'CERRADA') {
              setAlertaActiva(true);
              setAlertaId(alertaIdGuardada);
              setAlertaEstado(response.data.estado || 'PENDIENTE');
            } else {
              await AsyncStorage.removeItem('alertaActiva');
              await AsyncStorage.removeItem('alertaId');
              await AsyncStorage.removeItem('alertaEstado');
            }
          } catch (error) {
            setAlertaActiva(true);
            setAlertaId(alertaIdGuardada);
            setAlertaEstado(alertaEstadoGuardado || 'PENDIENTE');
          }
        } else {
          await verificarAlertaBackend(token);
        }
      }
    } catch (error) {
      console.log('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificarAlertaBackend = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/movil/alerta/activa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.alerta_id && 
          response.data.estado !== 'ATENDIDA' && 
          response.data.estado !== 'CERRADA') {
        setAlertaActiva(true);
        setAlertaId(response.data.alerta_id);
        setAlertaEstado(response.data.estado);
        await AsyncStorage.setItem('alertaActiva', 'true');
        await AsyncStorage.setItem('alertaId', response.data.alerta_id.toString());
        await AsyncStorage.setItem('alertaEstado', response.data.estado);
      }
    } catch (error) {
      console.log('No hay alerta activa en backend');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleAlertaActivada = (id, estado) => {
    setAlertaActiva(true);
    setAlertaId(id);
    setAlertaEstado(estado);
  };

  const handleAlertaFinalizada = () => {
    setAlertaActiva(false);
    setAlertaId(null);
    setAlertaEstado(null);
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

  if (alertaActiva) {
    return (
      <AlertaActivaScreen 
        alertaId={alertaId}
        estadoAlerta={alertaEstado}
        user={user}
        onAlertaFinalizada={handleAlertaFinalizada}
      />
    );
  }

  return (
    <HomeScreen 
      user={user} 
      onAlertaActivada={handleAlertaActivada}
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
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
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
  
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  userDoc: {
    fontSize: 14,
    color: '#070707',
    marginTop: 5,
  },
  botonPanico: { 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: '#8B0000', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  botonPanicoText: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  botonPanicoSubtext: { 
    color: 'white', 
    fontSize: 12, 
    marginTop: 10 
  },
  infoText: {
    marginTop: 30,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  alertaActivaFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertaCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertaIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  alertaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 10,
  },
  alertaId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  alertaEstado: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 15,
  },
  ubicacionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ubicacionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  ubicacionCoords: {
    fontSize: 11,
    color: '#999',
    marginBottom: 15,
  },
  contadorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B0000',
    marginVertical: 10,
  },
  loader: {
    marginVertical: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  verificandoText: {
    marginTop: 10,
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  
  footer: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});