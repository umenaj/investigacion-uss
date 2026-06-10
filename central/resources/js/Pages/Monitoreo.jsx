import MonitoreoLayout from '@/Layouts/MonitoreoLayout'
import { Head, Link, usePage, router } from '@inertiajs/react'
import { useEffect, useState, useRef, useCallback, memo } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CONFIGURACIÓN DINÁMICA DE URL
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

const getApiBaseUrl = () => {
    const { protocol, hostname, port, pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return `${protocol}//${hostname}/boton-panico/public`;
    }
    if (port === '8000') {
        return `${protocol}//${hostname}:8000`;
    }
    return `${protocol}//${hostname}`;
};

const API_BASE_URL = getApiBaseUrl();
const basePath = getBasePath();

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Colores por estado
const estadoColors = {
  'PENDIENTE': 'bg-red-100 text-red-700 border-red-200',
  'EN_ATENCION': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'ATENDIDA': 'bg-green-100 text-green-700 border-green-200'
};

const estadoIcons = {
  'PENDIENTE': '🔴',
  'EN_ATENCION': '🟡',
  'ATENDIDA': '🟢'
};

// icono personalizado para alertas
const alertIcon = L.divIcon({
  className: 'custom-alert-icon',
  html: '<div class="alert-marker bounce"><div class="alert-pulse"></div>📍</div>',
  iconSize: [30, 30],
  popupAnchor: [0, -15]
});

// estilos CSS para la animación
const alertStyles = `
  .custom-alert-icon { background: transparent; border: none; }
  .alert-marker { position: relative; font-size: 24px; animation: bounce 1s ease infinite; cursor: pointer; }
  .alert-pulse { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; background-color: rgba(139, 0, 0, 0.4); border-radius: 50%; animation: pulse 1.5s ease-out infinite; z-index: -1; }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
`;

// Componente para actualizar la vista del mapa
function ChangeMapView({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lng) map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

// Componente de controles de zoom
function ZoomControls() {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right" style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar bg-white rounded-lg shadow-md overflow-hidden">
        <button onClick={() => map.zoomIn()} className="block w-10 h-10 text-center bg-white hover:bg-gray-100 text-gray-700 text-xl font-bold border-b border-gray-200 transition-colors cursor-pointer" title="Acercar">+</button>
        <button onClick={() => map.zoomOut()} className="block w-10 h-10 text-center bg-white hover:bg-gray-100 text-gray-700 text-xl font-bold cursor-pointer transition-colors" title="Alejar">-</button>
      </div>
    </div>
  );
}

// Componente para renderizar alertas en el mapa
const AlertMarkers = memo(function AlertMarkers({ 
  alertas, 
  institucionLat, 
  institucionLng, 
  radioAlerta, 
  onSelectAlerta,
  ubicacionesTiempoReal 
}) {
  const markerRefs = useRef({});
  
  const alertasConUbicacion = alertas.filter(alerta => {
    const ubicacionRT = ubicacionesTiempoReal[alerta.id];
    const lat = ubicacionRT?.latitud || alerta.latitud_actual;
    const lng = ubicacionRT?.longitud || alerta.longitud_actual;
    if (!lat || !lng) return false;
    if (!institucionLat || !institucionLng) return true;
    
    const R = 6371;
    const lat1 = institucionLat * Math.PI / 180;
    const lat2 = parseFloat(lat) * Math.PI / 180;
    const dlat = lat2 - lat1;
    const dlng = (parseFloat(lng) - institucionLng) * Math.PI / 180;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2) * Math.sin(dlng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c * 1000;
    return distancia <= radioAlerta;
  });
  
  useEffect(() => {
    alertasConUbicacion.forEach(alerta => {
      const marker = markerRefs.current[alerta.id];
      const ubicacionRT = ubicacionesTiempoReal[alerta.id];
      if (marker && ubicacionRT) marker.setLatLng([ubicacionRT.latitud, ubicacionRT.longitud]);
    });
  }, [ubicacionesTiempoReal, alertasConUbicacion]);
  
  return (
    <>
      {alertasConUbicacion.map((alerta) => {
        const ubicacionRT = ubicacionesTiempoReal[alerta.id];
        const lat = ubicacionRT?.latitud || alerta.latitud_actual;
        const lng = ubicacionRT?.longitud || alerta.longitud_actual;
        return (
          <Marker
            key={alerta.id}
            position={[parseFloat(lat), parseFloat(lng)]}
            icon={alertIcon}
            ref={(ref) => { markerRefs.current[alerta.id] = ref; }}
            eventHandlers={{ click: () => onSelectAlerta(alerta) }}
          >
            <Popup>
              <div className="text-center min-w-[200px]">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🚨</span>
                  <strong className="text-red-700">{alerta.nombres} {alerta.primer_apellido}</strong>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">📄 DNI:</span> {alerta.documento}</p>
                  <p><span className="font-semibold">📞 Tel:</span> {alerta.telefono || 'No registrado'}</p>
                  <p className={`text-xs font-semibold ${ubicacionRT?.tiempo_transcurrido < 10 ? 'text-green-600' : 'text-orange-500'}`}>
                    {estadoIcons[alerta.estado]} Estado: {alerta.estado}
                  </p>
                  {ubicacionRT && (
                    <p className="text-xs text-gray-500">🕒 Actualizado hace {ubicacionRT.tiempo_transcurrido} seg</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});

// Modal para cambiar estado de alerta
function ModalCambiarEstado({ alerta, onClose, onSave }) {
  const [formData, setFormData] = useState({ estado: '', motivo: '', descripcion: '', observacion: '' });
  const [loading, setLoading] = useState(false);
  
  if (!alerta) return null;
  
  const opcionesEstado = alerta.estado === 'PENDIENTE' ? [{ value: 'EN_ATENCION', label: 'EN ATENCIÓN' }] : alerta.estado === 'EN_ATENCION' ? [{ value: 'ATENDIDA', label: 'ATENDIDA' }] : [];
  const estadoPorDefecto = opcionesEstado.length > 0 ? opcionesEstado[0].value : '';
  
  useEffect(() => { setFormData({ estado: estadoPorDefecto, motivo: '', descripcion: '', observacion: '' }); }, [alerta?.estado]);
  
  const handleSubmit = async () => {
    if (!formData.estado) return alert('Seleccione un estado');
    setLoading(true);
    await onSave(alerta.id, formData);
    setLoading(false);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-red-50 to-white">
          <h2 className="text-xl font-bold text-red-700">🔄 Cambiar Estado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Nuevo Estado</label>
            <select value={formData.estado} onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500">
              {opcionesEstado.map(est => <option key={est.value} value={est.value}>{est.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Motivo</label>
            <input type="text" placeholder="Ej: SE ENVIO AL AGENTE" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500" value={formData.motivo} onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Descripción</label>
            <textarea rows="3" placeholder="Descripción de la acción" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500" value={formData.descripcion} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 border rounded-xl text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Cambiar estado'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de detalle de alerta
function ModalDetalleAlerta({ alerta, onClose, victimaData, expedienteData, resolucionData, agresoresData, medidasData, loading, onCambiarEstado }) {
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  if (!alerta) return null;
  
  const puedeCambiarEstado = alerta.estado === 'PENDIENTE' || alerta.estado === 'EN_ATENCION';
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 flex justify-between items-center p-5 border-b bg-gradient-to-r from-red-50 to-white">
            <h2 className="text-xl font-bold text-red-700">🚨 Detalle de Alerta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div><p className="mt-3 text-gray-500">Cargando...</p></div>
            ) : (
              <>
                <div className="mb-6 bg-blue-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold mb-3">👤 Víctima</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p><strong>Documento:</strong> {victimaData?.documento || alerta.documento}</p>
                    <p><strong>Nombre:</strong> {victimaData?.nombres || alerta.nombres}</p>
                    <p><strong>Dirección:</strong> {victimaData?.direccion_completa || 'No registrada'}</p>
                    <p><strong>Teléfono:</strong> {victimaData?.telefono || alerta.telefono || 'No registrado'}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold">📊 Estado Actual</h3>
                    {puedeCambiarEstado && (
                      <button onClick={() => setShowCambiarEstado(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-700">
                        🔄 Cambiar Estado
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alerta.estado === 'PENDIENTE' ? 'bg-red-100' : alerta.estado === 'EN_ATENCION' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                        <span className="text-xl">{estadoIcons[alerta.estado]}</span>
                      </div>
                      <div><p className="font-semibold">{alerta.estado}</p><p className="text-xs text-gray-500">{new Date(alerta.created_at).toLocaleString()}</p></div>
                    </div>
                  </div>
                </div>
                
                {expedienteData && (
                  <div className="mb-6 bg-green-50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold mb-3">📋 Expediente</h3>
                    <p><strong>Número:</strong> {expedienteData.numero_expediente}</p>
                  </div>
                )}
                
                {agresoresData.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">👿 Agresor(es)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border rounded-xl">
                        <thead className="bg-gray-50"><tr><th className="p-3">Documento</th><th className="p-3">Nombres</th><th className="p-3">Apellidos</th></tr></thead>
                        <tbody>
                          {agresoresData.map((agresor, idx) => (
                            <tr key={idx} className="border-t"><td className="p-3">{agresor.numero_documento}</td><td className="p-3">{agresor.nombres}</td><td className="p-3">{agresor.primer_apellido}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end p-5 border-t bg-gray-50">
            <button onClick={onClose} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Cerrar</button>
          </div>
        </div>
      </div>
      
      {showCambiarEstado && <ModalCambiarEstado alerta={alerta} onClose={() => setShowCambiarEstado(false)} onSave={onCambiarEstado} />}
    </>
  );
}

// Modal para compartir ubicación por WhatsApp
function ModalCompartirWhatsApp({ alerta, onClose }) {
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
  if (!alerta) return null;
  
  const lat = alerta.latitud_actual || alerta.latitud;
  const lng = alerta.longitud_actual || alerta.longitud;
  const ubicacionUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const mensaje = `🚨 *ALERTA DE PÁNICO* 🚨\n\n*Víctima:* ${alerta.nombres} ${alerta.primer_apellido}\n*DNI:* ${alerta.documento}\n*Teléfono:* ${alerta.telefono}\n*Estado:* ${alerta.estado}\n*Hora:* ${new Date(alerta.created_at).toLocaleString()}\n*Ubicación:* ${ubicacionUrl}\n\n¡Se requiere asistencia inmediata!`;
  
  const enviarWhatsApp = () => {
    if (numeroWhatsApp) window.open(`https://wa.me/${numeroWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-green-50 to-white">
          <h2 className="text-xl font-bold text-green-700">📱 Compartir ubicación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p><strong>Víctima:</strong> {alerta.nombres} {alerta.primer_apellido}</p>
            <p><strong>DNI:</strong> {alerta.documento}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Número de WhatsApp:</label>
            <input type="tel" placeholder="Ej: 51987654321" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={numeroWhatsApp} onChange={(e) => setNumeroWhatsApp(e.target.value)} />
          </div>
          <button onClick={enviarWhatsApp} disabled={!numeroWhatsApp} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
            📤 Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================
// COMPONENTE PRINCIPAL MONITOREO
// ==============================================
export default function Monitoreo() {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;
  const user = props.auth.user;
  const institucionUsuario = props.auth.institucion;
  
  // Estados de sonido
  const [sonidoActivado, setSonidoActivado] = useState(true);
  const [alertaSonando, setAlertaSonando] = useState(false);
  const audioRef = useRef(null);
  const sonidoIntervalRef = useRef(null);
  
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [selectedAlertaDetalle, setSelectedAlertaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [ubicacionesTiempoReal, setUbicacionesTiempoReal] = useState({});
  const [intervalosActivos, setIntervalosActivos] = useState({});
  
  const [victimaCache, setVictimaCache] = useState({});
  const [expedienteCache, setExpedienteCache] = useState({});
  const [resolucionCache, setResolucionCache] = useState({});
  const [agresoresCache, setAgresoresCache] = useState({});
  const [medidasCache, setMedidasCache] = useState({});
  
  const intervalRef = useRef(null);
  
  const [alertasPendientes, setAlertasPendientes] = useState([]);
  const [alertasEnAtencion, setAlertasEnAtencion] = useState([]);
  const [alertasAppAntigua, setAlertasAppAntigua] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pendientes');
  const [selectedAlerta, setSelectedAlerta] = useState(null);
  const [zoom, setZoom] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');
  const [victimaData, setVictimaData] = useState(null);
  const [expedienteData, setExpedienteData] = useState(null);
  const [resolucionData, setResolucionData] = useState(null);
  const [agresoresData, setAgresoresData] = useState([]);
  const [medidasData, setMedidasData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [center, setCenter] = useState(() => {
    if (institucionUsuario?.latitud && institucionUsuario?.longitud) return [parseFloat(institucionUsuario.latitud), parseFloat(institucionUsuario.longitud)];
    return [-6.77519, -79.84353];
  });

  const institucionLat = institucionUsuario?.latitud ? parseFloat(institucionUsuario.latitud) : null;
  const institucionLng = institucionUsuario?.longitud ? parseFloat(institucionUsuario.longitud) : null;
  const radioAlerta = institucionUsuario?.radio_alerta_metros || 2000;

  // Cargar mapa después del primer render
  useEffect(() => {
    setTimeout(() => setMapLoaded(true), 100);
  }, []);

  // Inicializar audio con URL dinámica
  useEffect(() => {
    const audioUrl = `${basePath}/sounds/alert.mp3`;
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    audio.loop = false;
    audio.load();
    audioRef.current = audio;
    
    audio.addEventListener('error', (e) => {
     
    });
    
    return () => { 
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (sonidoIntervalRef.current) clearInterval(sonidoIntervalRef.current);
    };
  }, []);

  const estaEnPerimetro = useCallback((lat, lng) => {
    if (!institucionLat || !institucionLng || !lat || !lng) return true;
    const R = 6371;
    const lat1 = institucionLat * Math.PI / 180;
    const lat2 = parseFloat(lat) * Math.PI / 180;
    const dlat = lat2 - lat1;
    const dlng = (parseFloat(lng) - institucionLng) * Math.PI / 180;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2) * Math.sin(dlng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c * 1000;
    return distancia <= radioAlerta;
  }, [institucionLat, institucionLng, radioAlerta]);

  const alertasPendientesEnPerimetro = alertasPendientes.filter(alerta => estaEnPerimetro(alerta.latitud_actual || alerta.latitud, alerta.longitud_actual || alerta.longitud));

  const detenerSonidoAlerta = useCallback(() => {
    if (sonidoIntervalRef.current) { clearInterval(sonidoIntervalRef.current); sonidoIntervalRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setAlertaSonando(false);
  }, []);
  
  const iniciarSonidoAlerta = useCallback(() => {
    if (!sonidoActivado || alertaSonando) return;
    if (sonidoIntervalRef.current) clearInterval(sonidoIntervalRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const reproducir = () => { if (audioRef.current && sonidoActivado) audioRef.current.play().catch(() => {}); };
    reproducir();
    sonidoIntervalRef.current = setInterval(() => { if (sonidoActivado && alertasPendientesEnPerimetro.length > 0) reproducir(); else if (alertasPendientesEnPerimetro.length === 0) detenerSonidoAlerta(); }, 3000);
    setAlertaSonando(true);
  }, [sonidoActivado, alertaSonando, alertasPendientesEnPerimetro.length, detenerSonidoAlerta]);
  
  useEffect(() => {
    if (alertasPendientesEnPerimetro.length > 0 && sonidoActivado && !alertaSonando) iniciarSonidoAlerta();
    else if (alertasPendientesEnPerimetro.length === 0 && alertaSonando) detenerSonidoAlerta();
  }, [alertasPendientesEnPerimetro.length, sonidoActivado, alertaSonando, iniciarSonidoAlerta, detenerSonidoAlerta]);

 const actualizarUbicacionTiempoReal = useCallback(async (alertaId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/ubicacion/${alertaId}`);
        
        if (response.data.success && response.data.latitud && response.data.longitud) {
            const nuevaLat = parseFloat(response.data.latitud);
            const nuevaLng = parseFloat(response.data.longitud);
            const tiempoTranscurrido = response.data.tiempo_transcurrido_segundos || response.data.tiempo_transcurrido;
            const ultimaEmision = response.data.ultima_emision;
            
            setUbicacionesTiempoReal(prev => {
                return {
                    ...prev,
                    [alertaId]: {
                        latitud: nuevaLat,
                        longitud: nuevaLng,
                        tiempo_transcurrido: tiempoTranscurrido,
                        ultima_emision: ultimaEmision
                    }
                };
            });
            
            setAlertasPendientes(prev => prev.map(alerta => 
                alerta.id === alertaId ? { 
                    ...alerta, 
                    latitud_actual: nuevaLat, 
                    longitud_actual: nuevaLng 
                } : alerta
            ));
            setAlertasEnAtencion(prev => prev.map(alerta => 
                alerta.id === alertaId ? { 
                    ...alerta, 
                    latitud_actual: nuevaLat, 
                    longitud_actual: nuevaLng 
                } : alerta
            ));
        }
    } catch (error) { 
       
    }
}, []);

  useEffect(() => {
    const alertasActivas = [...alertasPendientes, ...alertasEnAtencion];
    Object.values(intervalosActivos).forEach(clearInterval);
    const nuevosIntervalos = {};
    alertasActivas.forEach(alerta => { actualizarUbicacionTiempoReal(alerta.id); nuevosIntervalos[alerta.id] = setInterval(() => actualizarUbicacionTiempoReal(alerta.id), 60000); });
    setIntervalosActivos(nuevosIntervalos);
    return () => Object.values(nuevosIntervalos).forEach(clearInterval);
  }, [alertasPendientes.length, alertasEnAtencion.length, actualizarUbicacionTiempoReal]);

  const fetchDatosVictima = useCallback(async (victimaId) => {
    if (victimaCache[victimaId]) return victimaCache[victimaId];
    try { const res = await axios.get(`${API_BASE_URL}/api/victimas/${victimaId}`); setVictimaCache(prev => ({ ...prev, [victimaId]: res.data })); return res.data; } catch (error) { return null; }
  }, [victimaCache]);

  const fetchExpediente = useCallback(async (victimaId) => {
    if (expedienteCache[victimaId]) return expedienteCache[victimaId];
    try { const res = await axios.get(`${API_BASE_URL}/api/victimas/${victimaId}/expedientes`); const expediente = res.data[0] || null; setExpedienteCache(prev => ({ ...prev, [victimaId]: expediente })); return expediente; } catch (error) { return null; }
  }, [expedienteCache]);

  const fetchResolucion = useCallback(async (expedienteId) => {
    if (!expedienteId || resolucionCache[expedienteId]) return resolucionCache[expedienteId];
    try { const res = await axios.get(`${API_BASE_URL}/api/resoluciones?expediente_id=${expedienteId}`); const resolucion = res.data[0] || null; setResolucionCache(prev => ({ ...prev, [expedienteId]: resolucion })); return resolucion; } catch (error) { return null; }
  }, [resolucionCache]);

  const fetchAgresores = useCallback(async (victimaId) => {
    if (agresoresCache[victimaId]) return agresoresCache[victimaId];
    try { const res = await axios.get(`${API_BASE_URL}/api/agresores?victima_id=${victimaId}`); setAgresoresCache(prev => ({ ...prev, [victimaId]: res.data })); return res.data; } catch (error) { return []; }
  }, [agresoresCache]);

  const fetchMedidas = useCallback(async (victimaId) => {
    if (medidasCache[victimaId]) return medidasCache[victimaId];
    try { const res = await axios.get(`${API_BASE_URL}/api/resoluciones?victima_id=${victimaId}`); setMedidasCache(prev => ({ ...prev, [victimaId]: res.data })); return res.data; } catch (error) { return []; }
  }, [medidasCache]);

  const handleVerDetalle = useCallback(async (alerta) => {
    setSelectedAlertaDetalle(alerta);
    setLoadingDetalle(true);
    const victima = await fetchDatosVictima(alerta.victima_id);
    const expediente = await fetchExpediente(alerta.victima_id);
    const resolucion = await fetchResolucion(expediente?.id);
    const agresores = await fetchAgresores(alerta.victima_id);
    const medidas = await fetchMedidas(alerta.victima_id);
    setVictimaData(victima);
    setExpedienteData(expediente);
    setResolucionData(resolucion);
    setAgresoresData(agresores);
    setMedidasData(medidas);
    setLoadingDetalle(false);
    setModalDetalleOpen(true);
  }, [fetchDatosVictima, fetchExpediente, fetchResolucion, fetchAgresores, fetchMedidas]);

  const handleVerUbicacion = (alerta) => {
    const lat = alerta.latitud_actual || alerta.latitud;
    const lng = alerta.longitud_actual || alerta.longitud;
    if (lat && lng) { setCenter([parseFloat(lat), parseFloat(lng)]); setZoom(17); setSelectedAlerta(alerta); }
    else alert('No hay ubicación disponible');
  };

  const handleCompartirUbicacion = (alerta) => { setSelectedAlertaDetalle(alerta); setModalWhatsAppOpen(true); };

  // ==============================================
// FUNCIÓN : handleGuardarEstado
// ==============================================
const handleGuardarEstado = async (alertaId, data) => {
  try {
    // Datos base que se envían
    const updateData = { 
      estado: data.estado, 
      motivo_cierre: data.motivo, 
      descripcion: data.descripcion, 
      observacion: data.observacion 
    };
    
    // ==============================================
    // SI CAMBIA A "EN ATENCIÓN"
    // ==============================================
    if (data.estado === 'EN_ATENCION') {
      // Quién asume la alerta
      updateData.asumida_por = props.auth.user?.id;
      
      // Nombre completo del monitoreador que asume
      updateData.atendido_por_nombre = `${props.auth.user?.nombres} ${props.auth.user?.primer_apellido}`;
      
      // Institución que atiende (comisaría del monitoreador)
      updateData.institucion_atencion = props.auth.institucion?.nombre;
      
      // ID de la comisaría asignada
      updateData.comisaria_asignada_id = props.auth.institucion?.id;
      
     
    }
    
    // ==============================================
    // SI CAMBIA A "ATENDIDA"
    // ==============================================
    if (data.estado === 'ATENDIDA') {
      // Quién atendió la alerta
      updateData.atendido_por = props.auth.user?.id;
      
      // Nombre completo de quien atendió
      updateData.atendido_por_nombre = `${props.auth.user?.nombres} ${props.auth.user?.primer_apellido}`;
      
     
    }
    
    // console.log('Enviando datos:', updateData);
    
    const response = await axios.put(`${API_BASE_URL}/api/alertas/${alertaId}`, updateData);
    
    if (response.data.success) {
      alert('✅ Estado actualizado correctamente');
      
      // Recargar lista de alertas
      fetchAlertas();
      
      // Cerrar modales
      setModalDetalleOpen(false);
      setModalWhatsAppOpen(false);
      
      //  (depuración)
      if (response.data.alerta) {
        // console.log(' Alerta actualizada:', response.data.alerta);
      }
    } else {
      // alert('Error: ' + (response.data.error || 'No se pudo actualizar'));
    }
  } catch (error) {
    // console.error('❌ Error al actualizar estado:', error);
    alert('Error al actualizar el estado de la alerta');
  }
};

  if (perfil !== 'MONITOREADOR') {
    return (
      <MonitoreoLayout>
        <Head title="Acceso Denegado" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
            <Link href={`${basePath}/dashboard`} className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded">Volver</Link>
          </div>
        </div>
      </MonitoreoLayout>
    );
  }

  useEffect(() => {
    fetchAlertas();
    intervalRef.current = setInterval(() => fetchAlertas(), 300000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const fetchAlertas = () => {
    axios.get(`${API_BASE_URL}/api/alertas`)
      .then(res => {
        setAlertasPendientes(res.data.pendientes || []);
        setAlertasEnAtencion(res.data.en_atencion || []);
        setAlertasAppAntigua(res.data.app_antigua || []);
        setInstituciones(res.data.instituciones || []);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const getAlertasByTab = () => {
    let alertas = selectedTab === 'pendientes' ? alertasPendientes : selectedTab === 'en_atencion' ? alertasEnAtencion : alertasAppAntigua;
    if (searchTerm) alertas = alertas.filter(a => a.documento?.includes(searchTerm) || a.nombres?.toLowerCase().includes(searchTerm.toLowerCase()));
    return alertas;
  };

  const counts = { pendientes: alertasPendientes.length, en_atencion: alertasEnAtencion.length, app_antigua: alertasAppAntigua.length };
  const currentAlertas = getAlertasByTab();
  const nombreInstitucion = institucionUsuario?.nombre || 'CPNP JOSE LEONARDO ORTIZ';
  const todasLasAlertas = [...alertasPendientes, ...alertasEnAtencion, ...alertasAppAntigua];

  if (loading) return (<MonitoreoLayout><Head title="Monitoreo" /><div className="flex items-center justify-center h-screen">Cargando alertas...</div></MonitoreoLayout>);

  return (
    <MonitoreoLayout>
      <Head title="Monitoreo" />
      <style>{alertStyles}</style>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out; }`}</style>
      
      {modalDetalleOpen && <ModalDetalleAlerta alerta={selectedAlertaDetalle} onClose={() => setModalDetalleOpen(false)} victimaData={victimaData} expedienteData={expedienteData} resolucionData={resolucionData} agresoresData={agresoresData} medidasData={medidasData} loading={loadingDetalle} onCambiarEstado={handleGuardarEstado} />}
      {modalWhatsAppOpen && <ModalCompartirWhatsApp alerta={selectedAlertaDetalle} onClose={() => setModalWhatsAppOpen(false)} />}
      
      {/* Controles de sonido */}
      <div className="absolute top-20 left-4 z-20 flex gap-2">
        <button onClick={() => setSonidoActivado(!sonidoActivado)} className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 ${sonidoActivado ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>
          {sonidoActivado ? '🔊 Sonido Activado' : '🔇 Sonido Desactivado'}
        </button>
        {alertasPendientesEnPerimetro.length > 0 && (
          <button onClick={detenerSonidoAlerta} className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg bg-orange-600 text-white flex items-center gap-2">⏹️ Silenciar</button>
        )}
        {alertasPendientesEnPerimetro.length > 0 && (
          <div className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg bg-red-100 text-red-700 animate-pulse flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            🔴 {alertasPendientesEnPerimetro.length} ALERTA(S) PENDIENTE(S)
          </div>
        )}
      </div>
      
      {/* Mapa */}
      <div className="fixed inset-0 z-0">
        {mapLoaded && (
          <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {institucionLat && institucionLng && <Circle center={[institucionLat, institucionLng]} radius={radioAlerta} pathOptions={{ color: '#8B0000', fillColor: '#8B0000', fillOpacity: 0.15, weight: 2 }} />}
            {institucionLat && institucionLng && <Marker position={[institucionLat, institucionLng]}><Popup><strong className="text-red-700">{nombreInstitucion}</strong><br />Radio: {radioAlerta} m</Popup></Marker>}
            {instituciones.map((inst) => <Marker key={inst.id} position={[parseFloat(inst.latitud), parseFloat(inst.longitud)]}><Popup><strong>{inst.nombre}</strong><br />{inst.direccion}</Popup></Marker>)}
            <AlertMarkers alertas={todasLasAlertas} institucionLat={institucionLat} institucionLng={institucionLng} radioAlerta={radioAlerta} onSelectAlerta={setSelectedAlerta} ubicacionesTiempoReal={ubicacionesTiempoReal} />
            {selectedAlerta && selectedAlerta.latitud_actual && <Circle center={[parseFloat(selectedAlerta.latitud_actual), parseFloat(selectedAlerta.longitud_actual)]} radius={500} pathOptions={{ color: '#8B0000', fillOpacity: 0.3 }} />}
            <ZoomControls />
            <ChangeMapView lat={center[0]} lng={center[1]} zoom={zoom} />
          </MapContainer>
        )}
      </div>

      {/* Panel de Alertas */}
      <div className="absolute top-24 right-4 z-10 w-80">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/95">
          <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex justify-between">
            <span>📡 Actualizando cada 1min</span>
            <span className="font-semibold">{Object.keys(ubicacionesTiempoReal).length} alerta(s) activa(s)</span>
          </div>
          
          <div className="flex border-b">
            <button onClick={() => setSelectedTab('pendientes')} className={`flex-1 px-3 py-2 text-center text-xs font-semibold ${selectedTab === 'pendientes' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-500'}`}>🔴 PENDIENTES ({counts.pendientes})</button>
            <button onClick={() => setSelectedTab('en_atencion')} className={`flex-1 px-3 py-2 text-center text-xs font-semibold ${selectedTab === 'en_atencion' ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50' : 'text-gray-500'}`}>🟡 EN ATENCIÓN ({counts.en_atencion})</button>
            <button onClick={() => setSelectedTab('app_antigua')} className={`flex-1 px-3 py-2 text-center text-xs font-semibold ${selectedTab === 'app_antigua' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}>📱 ANTIGUA ({counts.app_antigua})</button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {currentAlertas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">✨ No hay alertas</div>
            ) : (
              currentAlertas.map((alerta) => (
                <div key={alerta.id} className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedAlerta?.id === alerta.id ? 'bg-red-100 border-l-4 border-l-red-700' : ''}`} onClick={() => setSelectedAlerta(alerta)}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">{new Date(alerta.created_at).toLocaleTimeString()}</span>
                    {/* {ubicacionesTiempoReal[alerta.id] && <span className="text-xs text-green-600 animate-pulse">🔴 Activo</span>} */}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${estadoColors[alerta.estado]}`}>{estadoIcons[alerta.estado]} {alerta.estado}</span>
                    {ubicacionesTiempoReal[alerta.id]?.tiempo_transcurrido < 10 && <span className="text-xs text-green-600">🟢 Actualizado</span>}
                  </div>
                  <p className="font-semibold text-sm">{alerta.nombres} {alerta.primer_apellido}</p>
                  <p className="text-xs text-gray-500 mt-1">📄 DNI: {alerta.documento}</p>
                  {ubicacionesTiempoReal[alerta.id] && <p className="text-xs text-gray-400">📡 hace {ubicacionesTiempoReal[alerta.id].tiempo_transcurrido} seg</p>}
                  
                  <div className="flex gap-2 mt-3">
                    <button onClick={(e) => { e.stopPropagation(); handleVerDetalle(alerta); }} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700">👁️ Detalle</button>
                    <button onClick={(e) => { e.stopPropagation(); handleVerUbicacion(alerta); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700">📍 Mapa</button>
                    <button onClick={(e) => { e.stopPropagation(); handleCompartirUbicacion(alerta); }} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-purple-700">📤 Compartir</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`.leaflet-container { background: #eef2f7; }`}</style>
    </MonitoreoLayout>
  );
}