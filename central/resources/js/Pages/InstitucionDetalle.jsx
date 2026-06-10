import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// FUNCIÓN PARA OBTENER LA RUTA BASE 
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
  useEffect(() => {
    if (map) {
      map.setView([lat, lng], zoom);
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function InstitucionDetalle({ id }) {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;
  
  const [institucion, setInstitucion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(14);
  const [formData, setFormData] = useState({});
  const [radioAlerta, setRadioAlerta] = useState(1300);

  // Verificar permiso - Solo ADMIN puede ver esta página
  if (perfil !== 'ADMIN') {
    return (
      <AdminLayout>
        <Head title="Acceso Denegado" />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
          <Link href={`${basePath}/dashboard`} className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded">
            Volver al Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  useEffect(() => {
    fetchInstitucion();
  }, [id]);

  const fetchInstitucion = () => {
    axios.get(`${basePath}/api/instituciones/${id}`)
      .then(res => {
        setInstitucion(res.data);
        setFormData(res.data);
        setRadioAlerta(res.data.radio_alerta_metros || 1300);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData, radio_alerta_metros: radioAlerta };
      await axios.put(`${basePath}/api/instituciones/${id}`, dataToSend);
      alert("Datos actualizados correctamente");
      fetchInstitucion();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los datos");
    }
  };

  const tiposInstitucion = ["CPNP", "COMISARIA", "Juzgado", "Fiscalía", "DEMUNA", "CORTE SUPERIOR"];
  const distritosJudiciales = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO"];
  const departamentos = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO"];
  const provincias = ["CHICLAYO", "LAMBAYEQUE", "FERREÑAFE", "LIMA", "AREQUIPA"];

  const lat = parseFloat(formData.latitud) || -6.77519;
  const lng = parseFloat(formData.longitud) || -79.84353;
  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}&z=${zoom}`;

  if (loading) {
    return (
      <AdminLayout>
        <Head title="Detalle de Institución" />
        <div className="text-center py-12">Cargando...</div>
      </AdminLayout>
    );
  }

  if (!institucion) {
    return (
      <AdminLayout>
        <Head title="Detalle de Institución" />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Institución no encontrada</h2>
          <Link href={`${basePath}/instituciones`} className="text-red-600 mt-4 inline-block">Volver a la lista</Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title={`Detalle de ${institucion.nombre}`} />
      
      <div className="mb-4">
        <Link href={`${basePath}/instituciones`} className="text-red-600 hover:text-red-800">
          ← Volver a la lista
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Institución Detalle</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA - FORMULARIO */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Tipo de institución</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.tipo || ''}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {tiposInstitucion.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Nombre de institución</label>
              <input 
                type="text" 
                className="w-full border rounded px-3 py-2" 
                value={formData.nombre || ''} 
                onChange={(e) => handleInputChange('nombre', e.target.value)} 
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Distrito Judicial</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.distrito_judicial || ''}
                onChange={(e) => handleInputChange('distrito_judicial', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {distritosJudiciales.map(distrito => <option key={distrito} value={distrito}>{distrito}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Departamento</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.departamento || ''}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Provincia</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={formData.provincia || ''}
                onChange={(e) => handleInputChange('provincia', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Dirección completa</label>
              <textarea 
                rows="2" 
                className="w-full border rounded px-3 py-2" 
                value={formData.direccion || ''} 
                onChange={(e) => handleInputChange('direccion', e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Teléfono</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2" 
                  value={formData.telefono || ''} 
                  onChange={(e) => handleInputChange('telefono', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Latitud</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={formData.latitud || ''} 
                    onChange={(e) => handleInputChange('latitud', e.target.value)} 
                    placeholder="-12.047035"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Longitud</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={formData.longitud || ''} 
                    onChange={(e) => handleInputChange('longitud', e.target.value)} 
                    placeholder="-77.048707"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Zoom</label>
                  <select 
                    className="w-full border rounded px-3 py-2"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                  >
                    <option value="10">10</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 inline-block"
              >
                Ver
              </a>
            </div>
          </div>

          {/* COLUMNA DERECHA - MAPA */}
          <div>
            {/* PROXIMIDAD DE ALERTAS */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Proximidad de alertas (metros)</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">100</span>
                <input 
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  className="flex-1"
                  value={radioAlerta}
                  onChange={(e) => setRadioAlerta(parseInt(e.target.value))}
                />
                <span className="text-sm text-gray-500">5000</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-red-600 font-semibold text-lg">{radioAlerta}</span>
                <span className="text-gray-500"> metros</span>
              </div>
            </div>

            {/* Mapa */}
            <div>
              <label className="block text-sm font-semibold mb-2">Ubicación en el mapa</label>
              <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
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
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <strong>{formData.nombre}</strong><br />
                      {formData.direccion}<br />
                      <span className="text-red-600 font-semibold">Radio de alerta: {radioAlerta} metros</span>
                    </Popup>
                  </Marker>
                  <ChangeMapView lat={lat} lng={lng} zoom={zoom} />
                </MapContainer>
              </div>
            </div>

            {/* Botones de mapa */}
            <div className="flex gap-3 mt-4">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Abrir Google Maps
              </a>
              <a 
                href={`https://www.google.com/maps/place/${lat},${lng}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                Ver ubicación
              </a>
              <a 
                href={googleMapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                Ver zoom
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Nota:</strong> Los valores de latitud y longitud, son números decimales, por ejemplo: Latitud -12.047035 Longitud: -77.048707
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave} 
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}