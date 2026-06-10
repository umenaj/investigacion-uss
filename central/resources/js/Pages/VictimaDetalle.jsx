import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  FileText, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Building2,
  Globe,
  Smartphone,
  Lock,
  Key,
  FileWarning,
  Download,
  Trash2,
  Plus,
  X
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

export default function VictimaDetalle({ id }) {
  
  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [victima, setVictima] = useState(null);
  const [operadores, setOperadores] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState("");
  const [showNewExpediente, setShowNewExpediente] = useState(false);
  const [newExpediente, setNewExpediente] = useState("");
  const [showActaConsentimiento, setShowActaConsentimiento] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [restablecerClave, setRestablecerClave] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  // Verificar permiso
  if (perfil !== 'ADMIN' && perfil !== 'MONITOREADOR') {
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

  useEffect(() => {
    fetchVictimaDetail();
    fetchOperadores();
    fetchExpedientes();
  }, [id]);

  const fetchVictimaDetail = () => {
    axios.get(`${basePath}/api/victimas/${id}`)
      .then(res => {
        setVictima(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchOperadores = () => {
    axios.get(`${basePath}/api/operadores-telefonicos`)
      .then(res => setOperadores(res.data))
      .catch(err => console.error(err));
  };

  const fetchExpedientes = () => {
    axios.get(`${basePath}/api/victimas/${id}/expedientes`)
      .then(res => {
        setExpedientes(res.data);
      })
      .catch(err => console.error(err));
  };

  const handleInputChange = (field, value) => {
    setVictima(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert("Solo se permiten archivos PDF, JPG, PNG, DOC, DOCX");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo no debe superar los 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAddExpediente = () => {
    if (newExpediente.trim()) {
      axios.post(`${basePath}/api/victimas/${id}/expedientes`, {
        numero_expediente: newExpediente
      })
      .then(res => {
        fetchExpedientes();
        setSelectedExpediente(newExpediente);
        setShowNewExpediente(false);
        setNewExpediente("");
        alert("Expediente agregado correctamente");
      })
      .catch(err => console.error(err));
    } else {
      alert("Ingrese un número de expediente válido");
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    const dataToSend = {
      ...victima,
      ...(restablecerClave && tempPassword && { contrasena: tempPassword })
    };
    
    axios.put(`${basePath}/api/victimas/${victima.id}`, dataToSend)
      .then(res => {
        alert("Datos guardados correctamente");
        if (restablecerClave && tempPassword) {
          setRestablecerClave(false);
          setTempPassword("");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error al guardar");
      })
      .finally(() => setLoading(false));
  };

  const getNivelRiesgoBadge = (nivel) => {
    const niveles = {
      'BAJO': 'bg-green-100 text-green-700',
      'MEDIO': 'bg-yellow-100 text-yellow-700',
      'ALTO': 'bg-orange-100 text-orange-700',
      'CRITICO': 'bg-red-100 text-red-700',
      'SIN DETERMINAR': 'bg-gray-100 text-gray-700'
    };
    const icons = {
      'BAJO': '🟢',
      'MEDIO': '🟡',
      'ALTO': '🟠',
      'CRITICO': '🔴',
      'SIN DETERMINAR': '⚪'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${niveles[nivel] || niveles['SIN DETERMINAR']}`}>
        <span>{icons[nivel] || '⚪'}</span>
        {nivel || 'SIN DETERMINAR'}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <Head title="Detalle de Víctima" />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500">Cargando datos...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!victima) {
    return (
      <AdminLayout>
        <Head title="Detalle de Víctima" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Víctima no encontrada</h2>
          <p className="text-gray-500 mt-2">No se encontró la víctima que estás buscando.</p>
          <Link href={`${basePath}/victimas`} className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Volver a la lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title={`Detalle de ${victima.nombres} ${victima.primer_apellido}`} />
      
      {/* Header */}
      <div className="mb-6">
        <Link href={`${basePath}/victimas`} className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a la lista de víctimas
        </Link>
      </div>

      {/* Título de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-6 h-6 text-red-600" />
          {victima.nombres} {victima.primer_apellido} {victima.segundo_apellido}
        </h1>
        <p className="text-sm text-gray-500 mt-1">DNI: {victima.documento} • Nivel de riesgo: {getNivelRiesgoBadge(victima.nivel_riesgo)}</p>
      </div>

      {/* */}
      {/* 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: DATOS PERSONALES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-red-600" />
              Datos personales
            </h2>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Documento</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option>DOCUMENTO NACIONAL DE IDENTIDAD</option>
                <option>CARNET DE EXTRANJERIA</option>
                <option>PASAPORTE</option>
              </select>
              <div className="mt-2 text-sm text-gray-700">
                <span className="font-medium text-gray-500">Número:</span> {victima.documento || '-'}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre(s)</label>
              <input 
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={victima.nombres || ''}
                onChange={(e) => handleInputChange('nombres', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Primer Apellido</label>
              <input 
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={victima.primer_apellido || ''}
                onChange={(e) => handleInputChange('primer_apellido', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Segundo Apellido</label>
              <input 
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={victima.segundo_apellido || ''}
                onChange={(e) => handleInputChange('segundo_apellido', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sexo</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.sexo || ''}
                onChange={(e) => handleInputChange('sexo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Nacimiento</label>
              <input 
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.fecha_nacimiento || ''}
                onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">País de Nacionalidad</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.pais_nacionalidad || 'PERU'}
                onChange={(e) => handleInputChange('pais_nacionalidad', e.target.value)}
              >
                <option value="PERU">Perú</option>
                <option value="COLOMBIA">Colombia</option>
                <option value="CHILE">Chile</option>
                <option value="ARGENTINA">Argentina</option>
                <option value="ECUADOR">Ecuador</option>
                <option value="BOLIVIA">Bolivia</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: DATOS DE CONTACTO Y DIRECCIÓN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              Datos de contacto y dirección
            </h2>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico</label>
              <input 
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.email_personal || ''}
                onChange={(e) => handleInputChange('email_personal', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono celular</label>
              <input 
                type="tel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="9XXXXXXXX"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Operador</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.operador || ''}
                onChange={(e) => handleInputChange('operador', e.target.value)}
              >
                <option value="">Seleccionar operador</option>
                {operadores.map(op => (
                  <option key={op.id} value={op.nombre}>{op.nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Departamento</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.departamento || ''}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="LAMBAYEQUE">LAMBAYEQUE</option>
                <option value="LIMA">LIMA</option>
                <option value="AREQUIPA">AREQUIPA</option>
                <option value="LA LIBERTAD">LA LIBERTAD</option>
                <option value="PIURA">PIURA</option>
                <option value="CUSCO">CUSCO</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.provincia || ''}
                onChange={(e) => handleInputChange('provincia', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="CHICLAYO">CHICLAYO</option>
                <option value="LAMBAYEQUE">LAMBAYEQUE</option>
                <option value="FERREÑAFE">FERREÑAFE</option>
                <option value="LIMA">LIMA</option>
                <option value="AREQUIPA">AREQUIPA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distrito</label>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={victima.distrito || ''}
                onChange={(e) => handleInputChange('distrito', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="CHICLAYO">CHICLAYO</option>
                <option value="POMALCA">POMALCA</option>
                <option value="JAYANCA">JAYANCA</option>
                <option value="PIMENTEL">PIMENTEL</option>
                <option value="JOSE LEONARDO ORTIZ">JOSE LEONARDO ORTIZ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dirección completa</label>
              <textarea 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
                value={victima.direccion_completa || ''}
                onChange={(e) => handleInputChange('direccion_completa', e.target.value)}
                placeholder="Calle, número, urbanización, referencia"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 3: INFORMACIÓN DE VÍCTIMA Y EXPEDIENTES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Información de víctima
            </h2>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nivel de riesgo</label>
              <div className="mt-1">
                {getNivelRiesgoBadge(victima.nivel_riesgo)}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Formato Expediente</label>
              
              {expedientes.length > 0 ? (
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mt-1"
                  value={selectedExpediente}
                  onChange={(e) => {
                    setSelectedExpediente(e.target.value);
                    if (e.target.value) {
                      setShowActaConsentimiento(true);
                    }
                  }}
                >
                  <option value="">Seleccione un expediente</option>
                  {expedientes.map(exp => (
                    <option key={exp.id} value={exp.numero_expediente}>
                      {exp.numero_expediente}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 mt-1">No hay expedientes registrados</div>
              )}
              
              <button 
                onClick={() => setShowNewExpediente(!showNewExpediente)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm mt-2 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {showNewExpediente ? 'Cancelar' : 'Agregar nuevo expediente'}
              </button>
            </div>
            
            {selectedExpediente && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Expediente seleccionado:</span>
                </div>
                <div className="text-sm text-gray-800 mt-1 font-mono">{selectedExpediente}</div>
              </div>
            )}
            
            {showNewExpediente && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">Digitar Nuevo Expediente</label>
                <div className="border-t border-gray-200 my-2"></div>
                <p className="text-xs text-gray-400 mb-2">Ejemplo: 00005-2020-0-1801-JR-CO-06</p>
                <input 
                  type="text"
                  placeholder="Ingrese el número de expediente"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={newExpediente}
                  onChange={(e) => setNewExpediente(e.target.value)}
                />
                <button 
                  onClick={handleAddExpediente}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Guardar Expediente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTA DE CONSENTIMIENTO */}
      <div id="acta-consentimiento" className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-red-600" />
            Acta de consentimiento
          </h2>
        </div>
        
        <div className="p-5">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Arrastra y suelta el archivo aquí</p>
            <p className="text-gray-400 text-sm mb-3">o</p>
            <label className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg cursor-pointer transition-colors">
              Seleccionar archivo
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.jpg,.png,.doc,.docx"
              />
            </label>
            <p className="text-xs text-gray-400 mt-3">Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)</p>
            {selectedFile && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATOS DE ACCESO */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-600" />
            Datos de acceso
          </h2>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                checked={restablecerClave}
                onChange={(e) => setRestablecerClave(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Restablecer clave</span>
            </label>
          </div>
          
          {restablecerClave && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 pr-10" 
                  value={tempPassword} 
                  onChange={(e) => setTempPassword(e.target.value)} 
                  placeholder="Ingrese nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Usuario</label>
            <div className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              {victima.documento || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN GUARDAR CAMBIOS */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSubmit}
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

    </AdminLayout>
  );
}