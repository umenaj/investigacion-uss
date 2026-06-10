import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Radio, 
  Users, 
  Shield, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  X,
  Navigation,
  ZoomIn,
  Map
} from 'lucide-react';

// FUNCIÓN PARA OBTENER LA RUTA BASE (para el menú y navegación)
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

// FETCH (API)
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

function ChangeMapView({ lat, lng, zoom }) {
  const map = useMap();
  useState(() => {
    if (map && lat && lng) {
      map.setView([lat, lng], zoom);
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function InstitucionNuevo() {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(14);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [radioMostrar, setRadioMostrar] = useState(1300);
  const [formData, setFormData] = useState({
    tipo: "",
    nombre: "",
    distrito_judicial: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    telefono: "",
    latitud: "",
    longitud: "",
    radio_alerta_metros: 1300,
    nivel_respuesta: "NORMAL",
    capacidad_operadores: 5,
    activo: 1
  });

  // Verificar permiso - Solo ADMIN puede ver esta página
  if (perfil !== 'ADMIN') {
    return (
      <AdminLayout>
        <Head title="Acceso Denegado" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
          <Link href={`${basePath}/dashboard`} className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Volver al Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'radio_alerta_metros') {
      setRadioMostrar(value);
    }
    if (field === 'latitud' || field === 'longitud') {
      setMostrarMapa(false);
    }
  };

  const handleVerMapa = () => {
    if (formData.latitud && formData.longitud) {
      setMostrarMapa(true);
    } else {
      alert("Por favor ingrese latitud y longitud primero");
    }
  };

  const handleSave = async () => {
    if (!formData.tipo || !formData.nombre) {
      alert("El tipo y nombre de la institución son obligatorios");
      return;
    }
    
    console.log("Datos a enviar:", formData);
    console.log("nivel_respuesta:", formData.nivel_respuesta);
    
    setLoading(true);
    try {
      await axios.post(`${basePath}/api/instituciones`, formData);
      alert("Institución registrada correctamente");
      router.visit(`${basePath}/instituciones`);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los datos: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const tiposInstitucion = [
    { value: "CPNP", label: "CPNP", icon: "👮" },
    { value: "COMISARIA", label: "Comisaría", icon: "🏢" },
    { value: "Juzgado", label: "Juzgado", icon: "⚖️" },
    { value: "Fiscalía", label: "Fiscalía", icon: "📋" },
    { value: "DEMUNA", label: "DEMUNA", icon: "👨‍👩‍👧" },
    { value: "CORTE SUPERIOR", label: "Corte Superior", icon: "🏛️" }
  ];
  
  
  const nivelesRespuesta = ["INMEDIATA", "NORMAL", "SECUNDARIA"];
  
  const distritosJudiciales = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO", "ANCASH", "JUNIN", "SAN MARTIN"];
  const departamentos = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO", "ANCASH", "JUNIN", "SAN MARTIN"];
  const provincias = ["CHICLAYO", "LAMBAYEQUE", "FERREÑAFE", "LIMA", "AREQUIPA", "TRUJILLO", "PIURA", "CUSCO"];
  const distritos = ["CHICLAYO", "POMALCA", "JAYANCA", "PIMENTEL", "JOSE LEONARDO ORTIZ", "LA VICTORIA", "MIRAFLORES", "SAN ISIDRO"];

  const lat = parseFloat(formData.latitud) || -6.77519;
  const lng = parseFloat(formData.longitud) || -79.84353;
  const radioAlerta = formData.radio_alerta_metros || 1300;
  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}&z=${zoom}`;

  return (
    <AdminLayout>
      <Head title="Nueva Institución" />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header  */}
        <div className="mb-6">
          <Link href={`${basePath}/instituciones`} className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver a la lista de instituciones
          </Link>
        </div>

        {/* Título de la página */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-600" />
            Nueva Institución
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete el formulario para registrar una nueva institución</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* COLUMNA IZQUIERDA - FORMULARIO */}
              <div className="space-y-5">
                
                {/* Tipo de institución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de institución <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposInstitucion.map(tipo => <option key={tipo.value} value={tipo.value}>{tipo.icon} {tipo.label}</option>)}
                  </select>
                </div>

                {/* Nombre de institución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de institución <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    value={formData.nombre} 
                    onChange={(e) => handleInputChange('nombre', e.target.value)} 
                    placeholder="Ingrese el nombre completo de la institución"
                  />
                </div>

                {/* Distrito Judicial */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distrito Judicial</label>
                  <select 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.distrito_judicial}
                    onChange={(e) => handleInputChange('distrito_judicial', e.target.value)}
                  >
                    <option value="">Seleccionar distrito judicial</option>
                    {distritosJudiciales.map(distrito => <option key={distrito} value={distrito}>{distrito}</option>)}
                  </select>
                </div>

                {/* Ubicación geográfica */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.departamento}
                      onChange={(e) => handleInputChange('departamento', e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.provincia}
                      onChange={(e) => handleInputChange('provincia', e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.distrito}
                      onChange={(e) => handleInputChange('distrito', e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {distritos.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    </select>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección completa</label>
                  <textarea 
                    rows="2" 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                    value={formData.direccion} 
                    onChange={(e) => handleInputChange('direccion', e.target.value)} 
                    placeholder="Calle, número, urbanización, referencia"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                    value={formData.telefono} 
                    onChange={(e) => handleInputChange('telefono', e.target.value)} 
                    placeholder="Ingrese el teléfono de contacto"
                  />
                </div>

                {/* Coordenadas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coordenadas de ubicación</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Latitud</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                        value={formData.latitud} 
                        onChange={(e) => handleInputChange('latitud', e.target.value)} 
                        placeholder="-6.77519"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Longitud</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                        value={formData.longitud} 
                        onChange={(e) => handleInputChange('longitud', e.target.value)} 
                        placeholder="-79.84353"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleVerMapa}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <Map className="w-4 h-4" />
                    Ver en mapa
                  </button>
                </div>

                {/* Capacidad y nivel */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad de operadores</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.capacidad_operadores}
                      onChange={(e) => handleInputChange('capacidad_operadores', parseInt(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de respuesta</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.nivel_respuesta}
                      onChange={(e) => handleInputChange('nivel_respuesta', e.target.value)}
                    >
                      <option value="">Seleccionar nivel</option>
                      {nivelesRespuesta.map(nivel => <option key={nivel} value={nivel}>{nivel}</option>)}
                    </select>
                  </div>
                </div>

                {/* Estado activo */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      checked={formData.activo === 1}
                      onChange={(e) => handleInputChange('activo', e.target.checked ? 1 : 0)}
                    />
                    <span className="text-sm text-gray-700">Institución activa</span>
                  </label>
                </div>
              </div>

              {/* COLUMNA DERECHA - MAPA */}
              <div>
                {/* Radio de alerta */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-600" />
                    Radio de alerta (metros)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">100</span>
                    <input 
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                      value={formData.radio_alerta_metros}
                      onChange={(e) => handleInputChange('radio_alerta_metros', parseInt(e.target.value))}
                    />
                    <span className="text-xs text-gray-500">5000</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-red-600 font-bold text-lg">{formData.radio_alerta_metros}</span>
                    <span className="text-gray-500 text-sm"> metros</span>
                  </div>
                </div>

                {/* Mapa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Ubicación en el mapa
                  </label>
                  <div className="h-96 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    {mostrarMapa && formData.latitud && formData.longitud ? (
                      <MapContainer 
                        center={[lat, lng]} 
                        zoom={zoom} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Circle 
                          center={[lat, lng]} 
                          radius={radioAlerta}
                          pathOptions={{
                            color: '#ef4444',
                            fillColor: '#ef4444',
                            fillOpacity: 0.15,
                            weight: 2
                          }}
                        />
                        <Marker position={[lat, lng]}>
                          <Popup>
                            <div className="text-center">
                              <strong className="text-red-600">{formData.nombre || 'Nueva Institución'}</strong>
                              <p className="text-xs text-gray-500 mt-1">{formData.direccion || 'Dirección no especificada'}</p>
                              <hr className="my-1" />
                              <span className="text-xs font-semibold text-red-600">Radio: {radioAlerta} m</span>
                            </div>
                          </Popup>
                        </Marker>
                        <ChangeMapView lat={lat} lng={lng} zoom={zoom} />
                      </MapContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Ingrese latitud y longitud</p>
                          <p className="text-xs">y haga clic en "Ver en mapa"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Google Maps */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${formData.latitud && formData.longitud ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    onClick={(e) => {
                      if (!formData.latitud || !formData.longitud) {
                        e.preventDefault();
                        alert("Primero ingrese latitud y longitud");
                      }
                    }}
                  >
                    <Navigation className="w-3 h-3" />
                    Google Maps
                  </a>
                  <a 
                    href={`https://www.google.com/maps/place/${lat},${lng}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${formData.latitud && formData.longitud ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    onClick={(e) => {
                      if (!formData.latitud || !formData.longitud) {
                        e.preventDefault();
                        alert("Primero ingrese latitud y longitude");
                      }
                    }}
                  >
                    <MapPin className="w-3 h-3" />
                    Ver ubicación
                  </a>
                  <a 
                    href={googleMapsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${formData.latitud && formData.longitud ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    onClick={(e) => {
                      if (!formData.latitud || !formData.longitud) {
                        e.preventDefault();
                        alert("Primero ingrese latitud y longitud");
                      }
                    }}
                  >
                    <ZoomIn className="w-3 h-3" />
                    Ver zoom
                  </a>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Información importante</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Los valores de latitud y longitud son números decimales. 
                    Ejemplo: Latitud: <strong>-6.77519</strong> | Longitud: <strong>-79.84353</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link 
                href={`${basePath}/instituciones`} 
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}