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
  Eye, 
  EyeOff,
  Building2,
  Globe,
  Smartphone,
  Lock,
  Key,
  Users,
  Home,
  Briefcase
} from 'lucide-react';

// FUNCIÓN PARA OBTENER LA RUTA BASE (para el menú y navegación)
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

// PARA FETCH (API)
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

export default function UsuarioWebDetalle({ id }) {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
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
    email_institucional: "",
    email_personal: "",
    telefono: "",
    operador: "",
    telefono_secundario: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion_completa: "",
    direccion_referencia: "",
    institucion_id: "",
    perfil: "",
    activo: 1,
    password: "",
    nueva_password: ""
  });
  const [restablecerClave, setRestablecerClave] = useState(false);

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
    fetchUsuario();
    fetchOperadores();
    fetchInstituciones();
  }, [id]);

  const fetchUsuario = () => {
    axios.get(`${basePath}/api/usuarios-web/${id}`)
      .then(res => {
        setUsuario(res.data);
        setFormData({
          documento: res.data.documento || "",
          nombres: res.data.nombres || "",
          primer_apellido: res.data.primer_apellido || "",
          segundo_apellido: res.data.segundo_apellido || "",
          sexo: res.data.sexo || "",
          fecha_nacimiento: res.data.fecha_nacimiento || "",
          pais_nacionalidad: res.data.pais_nacionalidad || "PERU",
          email_institucional: res.data.email_institucional || "",
          email_personal: res.data.email_personal || "",
          telefono: res.data.telefono || "",
          operador: res.data.operador || "",
          telefono_secundario: res.data.telefono_secundario || "",
          departamento: res.data.departamento || "",
          provincia: res.data.provincia || "",
          distrito: res.data.distrito || "",
          direccion_completa: res.data.direccion_completa || "",
          direccion_referencia: res.data.direccion_referencia || "",
          institucion_id: res.data.institucion_id || "",
          perfil: res.data.perfil || "",
          activo: res.data.activo ?? 1,
          password: "",
          nueva_password: ""
        });
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

  const fetchInstituciones = () => {
    axios.get(`${basePath}/api/instituciones`)
      .then(res => setInstituciones(res.data))
      .catch(err => console.error(err));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSend = {
        nombres: formData.nombres,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento,
        pais_nacionalidad: formData.pais_nacionalidad,
        email_institucional: formData.email_institucional,
        email_personal: formData.email_personal,
        telefono: formData.telefono,
        operador: formData.operador,
        telefono_secundario: formData.telefono_secundario,
        departamento: formData.departamento,
        provincia: formData.provincia,
        distrito: formData.distrito,
        direccion_completa: formData.direccion_completa,
        direccion_referencia: formData.direccion_referencia,
        institucion_id: formData.institucion_id,
        perfil: formData.perfil,
        activo: formData.activo
      };
      
      if (restablecerClave && formData.nueva_password) {
        dataToSend.password = formData.nueva_password;
      }
      
      await axios.put(`${basePath}/api/usuarios-web/${id}`, dataToSend);
      alert("Datos actualizados correctamente");
      fetchUsuario();
      setRestablecerClave(false);
      setFormData(prev => ({ ...prev, nueva_password: "" }));
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los datos");
    } finally {
      setLoading(false);
    }
  };

  const getPerfilBadge = (perfil) => {
    const perfiles = {
      'ADMIN': 'bg-red-100 text-red-700',
      'MONITOREADOR': 'bg-blue-100 text-blue-700',
      'OPERADOR': 'bg-green-100 text-green-700',
      'VICTIMA': 'bg-yellow-100 text-yellow-700'
    };
    const icons = {
      'ADMIN': '👑',
      'MONITOREADOR': '👁️',
      'OPERADOR': '🎧',
      'VICTIMA': '👤'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${perfiles[perfil] || 'bg-gray-100 text-gray-700'}`}>
        <span>{icons[perfil] || '📌'}</span>
        {perfil || 'SIN PERFIL'}
      </span>
    );
  };

  const getEstadoBadge = (activo) => {
    return activo === 1 
      ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Activo</span>
      : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>Inactivo</span>;
  };

  const perfiles = ["ADMIN", "MONITOREADOR", "OPERADOR", "VICTIMA"];
  const sexos = ["FEMENINO", "MASCULINO", "OTRO"];
  const paises = ["PERU", "COLOMBIA", "CHILE", "ARGENTINA", "ECUADOR", "BOLIVIA"];
  const departamentos = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO", "ANCASH", "JUNIN", "SAN MARTIN"];
  const provincias = ["CHICLAYO", "LAMBAYEQUE", "FERREÑAFE", "LIMA", "AREQUIPA", "TRUJILLO", "PIURA", "CUSCO"];
  const distritos = ["CHICLAYO", "POMALCA", "JAYANCA", "PIMENTEL", "JOSE LEONARDO ORTIZ", "LA VICTORIA", "MIRAFLORES", "SAN ISIDRO"];

  if (loading) {
    return (
      <AdminLayout>
        <Head title="Detalle de Usuario" />
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

  if (!usuario) {
    return (
      <AdminLayout>
        <Head title="Detalle de Usuario" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Usuario no encontrado</h2>
          <p className="text-gray-500 mt-2">No se encontró el usuario que estás buscando.</p>
          <Link href={`${basePath}/usuarios-web`} className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Volver a la lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title={`Detalle de ${usuario.nombres} ${usuario.primer_apellido}`} />
      
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
            <User className="w-6 h-6 text-red-600" />
            {usuario.nombres} {usuario.primer_apellido} {usuario.segundo_apellido}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {getPerfilBadge(formData.perfil)}
            {getEstadoBadge(formData.activo)}
            <span className="text-sm text-gray-500">DNI: {formData.documento}</span>
          </div>
        </div>

        {/*  */}
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Documento</label>
                <div className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200">
                  {formData.documento || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre(s)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                  value={formData.nombres} 
                  onChange={(e) => handleInputChange('nombres', e.target.value)} 
                  placeholder="Ingrese nombres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Primer Apellido</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.primer_apellido} 
                  onChange={(e) => handleInputChange('primer_apellido', e.target.value)} 
                  placeholder="Apellido paterno"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Segundo Apellido</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.segundo_apellido} 
                  onChange={(e) => handleInputChange('segundo_apellido', e.target.value)} 
                  placeholder="Apellido materno"
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico institucional</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.email_institucional} 
                  onChange={(e) => handleInputChange('email_institucional', e.target.value)} 
                  placeholder="correo@institucion.gob.pe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico personal</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.email_personal} 
                  onChange={(e) => handleInputChange('email_personal', e.target.value)} 
                  placeholder="correo@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono celular</label>
                <input 
                  type="tel" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.telefono} 
                  onChange={(e) => handleInputChange('telefono', e.target.value)} 
                  placeholder="9XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono secundario</label>
                <input 
                  type="tel" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.telefono_secundario} 
                  onChange={(e) => handleInputChange('telefono_secundario', e.target.value)} 
                  placeholder="Teléfono fijo o alternativo"
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
                  value={formData.direccion_completa} 
                  onChange={(e) => handleInputChange('direccion_completa', e.target.value)} 
                  placeholder="Calle, número, urbanización"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Referencia de dirección</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.direccion_referencia} 
                  onChange={(e) => handleInputChange('direccion_referencia', e.target.value)} 
                  placeholder="Punto de referencia cercano"
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                  value={formData.activo} 
                  onChange={(e) => handleInputChange('activo', parseInt(e.target.value))}
                >
                  <option value={1}>✅ Activo</option>
                  <option value={0}>❌ Inactivo</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="restablecerClave"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  checked={restablecerClave}
                  onChange={(e) => setRestablecerClave(e.target.checked)}
                />
                <label htmlFor="restablecerClave" className="text-sm text-gray-700 cursor-pointer">
                  Restablecer contraseña
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Usuario</label>
                <div className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200">
                  {formData.documento || '-'}
                </div>
              </div>
              {restablecerClave && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 pr-10" 
                      placeholder="Ingrese nueva contraseña"
                      value={formData.nueva_password || ''}
                      onChange={(e) => handleInputChange('nueva_password', e.target.value)}
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