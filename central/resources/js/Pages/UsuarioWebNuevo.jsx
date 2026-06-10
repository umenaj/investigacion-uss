import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState, useEffect } from "react";
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
  Eye, 
  EyeOff,
  Building2,
  Globe,
  Smartphone,
  Lock,
  Key,
  Users,
  Home,
  Briefcase,
  CheckCircle,
  AlertCircle
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

export default function UsuarioWebNuevo() {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [loading, setLoading] = useState(false);
  const [operadores, setOperadores] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    documento: "",
    nombres: "",
    primer_apellido: "",
    segundo_apellido: "",
    sexo: "",
    fecha_nacimiento: "",
    pais_nacionalidad: "PERU",
    email_personal: "",
    telefono: "",
    operador: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion_completa: "",
    institucion_id: "",
    perfil: "",
    password: ""
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

  useEffect(() => {
    fetchOperadores();
    fetchInstituciones();
  }, []);

  const fetchOperadores = () => {
    axios.get(`${basePath}/api/operadores-telefonicos`)
      .then(res => setOperadores(res.data))
      .catch(err => console.error(err));
  };

  const fetchInstituciones = () => {
    axios.get(`${basePath}/api/instituciones`)
      .then(res => setInstituciones(res.data))
      .catch(err => console.error(err));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.documento || !formData.password) {
      alert("El documento y la contraseña son obligatorios");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${basePath}/api/usuarios-web`, formData);
      alert("Usuario registrado correctamente");
      router.visit(`${basePath}/usuarios-web`);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los datos: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const perfiles = ["ADMIN", "MONITOREADOR", "OPERADOR"];
  const sexos = ["FEMENINO", "MASCULINO", "OTRO"];
  const paises = ["PERU", "COLOMBIA", "CHILE", "ARGENTINA", "ECUADOR", "BOLIVIA"];
  const departamentos = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO", "ANCASH", "JUNIN", "SAN MARTIN"];
  const provincias = ["CHICLAYO", "LAMBAYEQUE", "FERREÑAFE", "LIMA", "AREQUIPA", "TRUJILLO", "PIURA", "CUSCO"];
  const distritos = ["CHICLAYO", "POMALCA", "JAYANCA", "PIMENTEL", "JOSE LEONARDO ORTIZ", "LA VICTORIA", "MIRAFLORES", "SAN ISIDRO"];

  return (
    <AdminLayout>
      <Head title="Nuevo Usuario Web" />
      
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <Link href={`${basePath}/usuarios-web`} className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver a la lista de usuarios
          </Link>
        </div>

        {/* Título de la página */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            Nuevo Usuario Web
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete el formulario para registrar un nuevo usuario en el sistema</p>
        </div>

        {/* COLUMNAS ARRIBA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* CARD 1: DATOS PERSONALES */}
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
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                  <option>DOCUMENTO NACIONAL DE IDENTIDAD</option>
                  <option>CARNET DE EXTRANJERIA</option>
                  <option>PASAPORTE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Número de Documento *</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                  placeholder="Ingrese el número de documento"
                  value={formData.documento}
                  onChange={(e) => handleInputChange('documento', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre(s)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="Ingrese nombres"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Primer Apellido</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="Apellido paterno"
                  value={formData.primer_apellido}
                  onChange={(e) => handleInputChange('primer_apellido', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Segundo Apellido</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="Apellido materno"
                  value={formData.segundo_apellido}
                  onChange={(e) => handleInputChange('segundo_apellido', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sexo</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.sexo}
                  onChange={(e) => handleInputChange('sexo', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {sexos.map(sexo => <option key={sexo} value={sexo}>{sexo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Nacimiento</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">País de Nacionalidad</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.pais_nacionalidad}
                  onChange={(e) => handleInputChange('pais_nacionalidad', e.target.value)}
                >
                  {paises.map(pais => <option key={pais} value={pais}>{pais}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CARD 2: DATOS DE CONTACTO Y DIRECCIÓN */}
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
                  placeholder="correo@ejemplo.com"
                  value={formData.email_personal}
                  onChange={(e) => handleInputChange('email_personal', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono celular</label>
                <input 
                  type="tel" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="9XXXXXXXX"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Operador</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.operador}
                  onChange={(e) => handleInputChange('operador', e.target.value)}
                >
                  <option value="">Seleccionar operador</option>
                  {operadores.map(op => <option key={op.id} value={op.nombre}>{op.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Departamento</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.departamento}
                  onChange={(e) => handleInputChange('departamento', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Distrito</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.distrito}
                  onChange={(e) => handleInputChange('distrito', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {distritos.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dirección completa</label>
                <textarea 
                  rows="2" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="Calle, número, urbanización"
                  value={formData.direccion_completa}
                  onChange={(e) => handleInputChange('direccion_completa', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: DATOS DE ACCESO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" />
              Datos de acceso
            </h2>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Institución</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.institucion_id}
                  onChange={(e) => handleInputChange('institucion_id', e.target.value)}
                >
                  <option value="">Seleccionar institución</option>
                  {instituciones.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Perfil</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.perfil}
                  onChange={(e) => handleInputChange('perfil', e.target.value)}
                >
                  <option value="">Seleccione el perfil</option>
                  {perfiles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Usuario</label>
                <div className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200">
                  {formData.documento || 'El número de documento será el usuario'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 pr-10" 
                    placeholder="Ingrese la contraseña"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR CAMBIOS */}
        <div className="flex justify-end">
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
    </AdminLayout>
  );
}