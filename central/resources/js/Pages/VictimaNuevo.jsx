import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState } from "react";
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
  FileWarning
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
        return `${protocol}//${hostname}`;
    }
    
    if (port === '8000') {
        return `${protocol}//${hostname}:8000`;
    }
    
    return `${protocol}//${hostname}`;
};

const API_BASE_URL = getApiBaseUrl();
const basePath = getBasePath();

export default function VictimaNuevo() {
  
  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [currentStep, setCurrentStep] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSijModal, setShowSijModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [victimaExistente, setVictimaExistente] = useState(null);
  const [showRegistro, setShowRegistro] = useState(false);
  const [tempDocumento, setTempDocumento] = useState("");
  const [tempExpediente, setTempExpediente] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    numero: "",
    expediente_completo: "",
    nombres: "",
    primer_apellido: "",
    segundo_apellido: "",
    sexo: "",
    fecha_nacimiento: "",
    pais: "PERU",
    email: "",
    telefono: "",
    operador: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    nivel_riesgo: "",
    usuario: "",
    contrasena: "",
    archivo_consentimiento: null
  });

  const [operadores, setOperadores] = useState([
    { id: 1, nombre: "CLARO", icon: "📱" },
    { id: 2, nombre: "MOVISTAR", icon: "📶" },
    { id: 3, nombre: "ENTEL", icon: "📡" },
    { id: 4, nombre: "BITEL", icon: "📞" }
  ]);

  const nivelesRiesgo = [
    { value: "BAJO", color: "bg-green-100 text-green-700", icon: "🟢" },
    { value: "MEDIO", color: "bg-yellow-100 text-yellow-700", icon: "🟡" },
    { value: "ALTO", color: "bg-orange-100 text-orange-700", icon: "🟠" },
    { value: "CRITICO", color: "bg-red-100 text-red-700", icon: "🔴" },
    { value: "SIN DETERMINAR", color: "bg-gray-100 text-gray-700", icon: "⚪" }
  ];
  
  const departamentos = ["LAMBAYEQUE", "LIMA", "AREQUIPA", "LA LIBERTAD", "PIURA", "CUSCO", "ANCASH", "JUNIN", "SAN MARTIN"];
  const provincias = ["CHICLAYO", "LAMBAYEQUE", "FERREÑAFE", "LIMA", "AREQUIPA", "TRUJILLO", "PIURA", "CUSCO"];
  const distritos = ["CHICLAYO", "POMALCA", "JAYANCA", "PIMENTEL", "JOSE LEONARDO ORTIZ", "LA VICTORIA", "MIRAFLORES", "SAN ISIDRO"];

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage("Solo se permiten archivos PDF, JPG o PNG");
        setShowErrorModal(true);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("El archivo no debe superar los 5MB");
        setShowErrorModal(true);
        return;
      }
      setFormData(prev => ({ ...prev, archivo_consentimiento: file }));
    }
  };

  const handleValidar = async () => {
    if (!formData.numero || !formData.expediente_completo) {
      let missing = [];
      if (!formData.numero) missing.push("Número de documento");
      if (!formData.expediente_completo) missing.push("Expediente");
      setErrorMessage(`Faltan los siguientes campos: ${missing.join(", ")}`);
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    
    try {
      
      const response = await axios.get(`${basePath}/api/victimas/validar`, {
        params: {
          documento: formData.numero,
          expediente: formData.expediente_completo
        }
      });
      
      console.log("Respuesta del API:", response.data);
      
      if (response.data.exists && response.data.asociado) {
        const victima = response.data.victima;
        
        setFormData(prev => ({
          ...prev,
          nombres: victima.nombres || "",
          primer_apellido: victima.primer_apellido || "",
          segundo_apellido: victima.segundo_apellido || "",
          sexo: victima.sexo || "",
          fecha_nacimiento: victima.fecha_nacimiento || "",
          pais: victima.pais_nacionalidad || "PERU",
          email: victima.email_personal || "",
          telefono: victima.telefono || "",
          operador: victima.operador || "",
          departamento: victima.departamento || "",
          provincia: victima.provincia || "",
          distrito: victima.distrito || "",
          direccion: victima.direccion_completa || "",
          nivel_riesgo: victima.nivel_riesgo || "",
          usuario: victima.documento || prev.numero,
          contrasena: "",
          expediente_completo: victima.expediente || prev.expediente_completo
        }));
        
        setVictimaExistente(victima);
        setShowRegistro(true);
        setCurrentStep(2);
      } else {
        setTempDocumento(formData.numero);
        setTempExpediente(formData.expediente_completo);
        setShowSijModal(true);
      }
    } catch (error) {
      console.error("Error en validación:", error);
      setTempDocumento(formData.numero);
      setTempExpediente(formData.expediente_completo);
      setShowSijModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinuarRegistro = () => {
    setShowSijModal(false);
    setFormData(prev => ({
      ...prev,
      usuario: prev.numero,
      contrasena: ""
    }));
    setShowRegistro(true);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dataToSend = {
        documento: formData.numero,
        nombres: formData.nombres,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento,
        pais: formData.pais,
        email: formData.email,
        telefono: formData.telefono,
        operador: formData.operador,
        departamento: formData.departamento,
        provincia: formData.provincia,
        distrito: formData.distrito,
        direccion: formData.direccion,
        nivel_riesgo: formData.nivel_riesgo,
        expediente_completo: formData.expediente_completo,
        contrasena: formData.contrasena
      };
      
      console.log("Datos a enviar:", dataToSend);
      
      if (victimaExistente) {
       
        await axios.put(`${basePath}/api/victimas/${victimaExistente.id}`, dataToSend);
        alert("Datos actualizados correctamente");
      } else {
       
        await axios.post(`${basePath}/api/victimas`, dataToSend);
        alert("Víctima registrada correctamente");
      }
      router.visit(`${basePath}/victimas`);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los datos: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const ErrorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Campos Incompletos</h3>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button onClick={() => setShowErrorModal(false)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );

  const SijModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileWarning className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Atención</h3>
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Validación de datos</h4>
          <p className="text-gray-600 mb-4">
            No se encontraron datos de integración con el Sistema Integrado Judicial (SIJ) 
            para el tipo y número de documento de identidad, así como el expediente ingresado.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Documento:</span> {tempDocumento}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">Expediente:</span> {tempExpediente}
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            He validado los datos ingresados y son correctos.  
            Deseo continuar con el registro, incluso si no se cuenta con la información centralizada.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowSijModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleContinuarRegistro} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-colors">
              Continuar con el registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const getNivelRiesgoBadge = (nivel) => {
    const found = nivelesRiesgo.find(n => n.value === nivel);
    if (!found) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${found.color}`}>
        <span>{found.icon}</span>
        {found.value}
      </span>
    );
  };

  return (
    <AdminLayout>
      <Head title="Nueva Víctima" />
      
      {/* Header  */}
      <div className="mb-6">
        <Link href={`${basePath}/victimas`} className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a la lista de víctimas
        </Link>
      </div>

      {showErrorModal && <ErrorModal />}
      {showSijModal && <SijModal />}

      <div className="max-w-4xl mx-auto">
        
        {/*  */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep === 1 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                currentStep === 1 ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className="text-xs font-medium mt-2">Validar víctima</span>
            </div>
            <div className={`w-16 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
            <div className={`flex flex-col items-center ${currentStep === 2 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                currentStep === 2 ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="text-xs font-medium mt-2">Registrar Víctima</span>
            </div>
          </div>
        </div>

        {/* PASO 1: VALIDAR VÍCTIMA */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 text-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Validar víctima
              </h2>
              <p className="text-sm text-gray-500 mt-1">Ingrese los datos de la víctima para validar en el sistema</p>
            </div>

            <div className="p-8">
              <div className="max-w-md mx-auto">
                {/* Tipo de Documento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Tipo de Documento
                  </label>
                  <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center">
                    <option>DOCUMENTO NACIONAL DE IDENTIDAD</option>
                    <option>CARNET DE EXTRANJERIA</option>
                    <option>PASAPORTE</option>
                  </select>
                </div>

                {/* Número de Documento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Número de Documento
                  </label>
                  <input 
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Ingrese el número de documento"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                  />
                </div>

                {/* Expediente */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Expediente
                  </label>
                  
                  {/* Formato de referencia */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Formato de referencia:</p>
                    <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1 rounded inline-block">
                      0001-2005-0-1817-JR-CO-06
                    </code>
                  </div>
                  
                  <input 
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Ingrese el número de expediente completo"
                    value={formData.expediente_completo}
                    onChange={(e) => handleInputChange("expediente_completo", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Ejemplo: 00005-2020-0-1801-JR-CO-06
                  </p>
                </div>

                {/* Imagen de referencia */}
                <div className="flex justify-center my-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img 
                      src={`${basePath}/images/expediente.png`}
                      alt="Formato de expediente"
                      className="h-28 object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                </div>

                {/* Botón */}
                <div className="border-t border-gray-100 pt-6 text-center">
                  <button 
                    onClick={handleValidar}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Validar víctima
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: REGISTRAR VÍCTIMA */}
        {currentStep === 2 && showRegistro && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Registrar Víctima
              </h2>
              <p className="text-sm text-gray-500 mt-1">Complete la información personal y de contacto de la víctima</p>
            </div>

            <div className="p-6">
              {/* Datos personales */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  Datos personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500" value={formData.numero || ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" value={formData.nombres || ''} onChange={(e) => handleInputChange("nombres", e.target.value)} placeholder="Ingrese nombres" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" value={formData.primer_apellido || ''} onChange={(e) => handleInputChange("primer_apellido", e.target.value)} placeholder="Apellido paterno" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" value={formData.segundo_apellido || ''} onChange={(e) => handleInputChange("segundo_apellido", e.target.value)} placeholder="Apellido materno" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.sexo || ""} onChange={(e) => handleInputChange("sexo", e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="MASCULINO">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                    <input type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.fecha_nacimiento || ""} onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">País de Nacionalidad</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.pais || "PERU"} onChange={(e) => handleInputChange("pais", e.target.value)}>
                      <option value="PERU">Perú</option>
                      <option value="COLOMBIA">Colombia</option>
                      <option value="CHILE">Chile</option>
                      <option value="ARGENTINA">Argentina</option>
                      <option value="BOLIVIA">Bolivia</option>
                      <option value="ECUADOR">Ecuador</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  Datos de contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input type="email" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.email || ""} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="ejemplo@correo.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono celular</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.telefono || ""} onChange={(e) => handleInputChange("telefono", e.target.value)} placeholder="9XXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.operador || ""} onChange={(e) => handleInputChange("operador", e.target.value)}>
                      <option value="">Seleccionar operador</option>
                      {operadores.map(op => <option key={op.id} value={op.nombre}>{op.icon} {op.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Dirección
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.departamento || ""} onChange={(e) => handleInputChange("departamento", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.provincia || ""} onChange={(e) => handleInputChange("provincia", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.distrito || ""} onChange={(e) => handleInputChange("distrito", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {distritos.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección completa</label>
                  <textarea 
                    rows="2" 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" 
                    value={formData.direccion || ""} 
                    onChange={(e) => handleInputChange("direccion", e.target.value)} 
                    placeholder="Ingrese la dirección completa (calle, número, urbanización, referencia)"
                  />
                </div>
              </div>

              {/* Información de víctima */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  Información de seguridad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de riesgo</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" value={formData.nivel_riesgo || ""} onChange={(e) => handleInputChange("nivel_riesgo", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {nivelesRiesgo.map(nivel => <option key={nivel.value} value={nivel.value}>{nivel.icon} {nivel.value}</option>)}
                    </select>
                    {formData.nivel_riesgo && (
                      <div className="mt-2">
                        {getNivelRiesgoBadge(formData.nivel_riesgo)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato Expediente</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500" value={formData.expediente_completo || ""} readOnly />
                  </div>
                </div>
              </div>

              {/* Acta de consentimiento */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  Acta de consentimiento
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Arrastra y suelta el archivo aquí</p>
                  <p className="text-gray-400 text-sm mb-3">o</p>
                  <label className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg cursor-pointer transition-colors">
                    Seleccionar archivo
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                  </label>
                  <p className="text-xs text-gray-400 mt-3">Formatos permitidos: PDF, JPG, PNG (máx. 5MB)</p>
                  {formData.archivo_consentimiento && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg inline-flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">{formData.archivo_consentimiento.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos de acceso */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  Datos de acceso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500" value={formData.usuario || formData.numero} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 pr-10" 
                        value={formData.contrasena || ""} 
                        onChange={(e) => handleInputChange("contrasena", e.target.value)} 
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
                    <p className="text-xs text-gray-400 mt-1">Dejar vacío para mantener la contraseña actual</p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="border-t border-gray-100 pt-6 flex justify-center gap-4">
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="px-8 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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
        )}
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}