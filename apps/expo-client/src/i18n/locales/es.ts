import type { TranslationResource } from "../types";

/**
 * Spanish translations. Must mirror the keys of the English resource.
 */
export const es: TranslationResource = {
  common: {
    cancel: "Cancelar",
    save: "Guardar",
    close: "Cerrar",
    continue: "Continuar",
    goBack: "Volver",
    gotIt: "¡Entendido!",
    ok: "OK",
    error: "Error",
    retry: "Reintentar",
    tapToRetry: "Toca para volver a intentarlo",
    or: "o",
    undo: "Deshacer",
  },
  navigation: {
    goBack: "Volver atrás",
    goHome: "Ir al inicio",
    myProfile: "Mi perfil",
  },
  header: {
    logIn: "Entrar",
    logInA11y: "Iniciar sesión",
    getStarted: "Empezar",
    getStartedA11y: "Empezar",
    myWishlistA11y: "Mi lista de deseos",
    logoutA11y: "Cerrar sesión",
  },
  auth: {
    usernameLabel: "Nombre de usuario",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    togglePasswordVisibility: "Mostrar u ocultar contraseña",
    login: {
      title: "¡Hola de nuevo!",
      subtitle: "¡Qué alegría verte por aquí! Entra y sigue con tus listas.",
      googleButton: "Iniciar sesión con Google",
      submit: "Iniciar sesión",
      switchToRegister: "¿Todavía no tienes cuenta? ¡Únete, te esperamos!",
      missingFields: "¡Ups! Necesitamos tu correo y tu contraseña para entrar.",
      failed:
        "Vaya, no hemos podido iniciar tu sesión. Revisa tus datos o prueba de nuevo en un ratito.",
    },
    register: {
      title: "Únete a Wishin",
      subtitle:
        "Crea tu cuenta en un momento y empieza a compartir tus deseos con quien más quieres.",
      googleButton: "Registrarse con Google",
      submit: "Registrarse",
      switchToLogin: "¿Ya tienes cuenta? ¡Inicia sesión!",
      missingFields: "¡Casi lo tienes! Solo falta rellenar todos los campos.",
      failed: "Vaya, no hemos podido crear tu cuenta. ¿Lo intentamos otra vez?",
      googleFailed:
        "Ups, el registro con Google no ha salido bien. ¿Lo intentamos otra vez?",
    },
    errors: {
      accountExists:
        "¡Ya tienes una cuenta con este correo! Prueba a iniciar sesión.",
      invalidCredentials: "Credenciales inválidas.",
    },
    google: {
      failed:
        "Ups, no hemos podido entrar con Google. ¿Lo intentamos otra vez?",
      accountConflict:
        "Parece que esta cuenta de Google está ligada a otra sesión abierta en tu navegador. Cierra la sesión de Wishin allí (o borra los datos del sitio) y vuelve a probar.",
      incomplete:
        "No hemos podido terminar de conectar con Google. ¿Lo intentamos otra vez?",
      cancelled:
        "Se ha cancelado el inicio de sesión con Google o algo no ha ido bien. ¿Probamos de nuevo?",
      signInFailedTitle: "Vaya, no hemos podido entrar",
    },
  },
  home: {
    tagline: "Comparte tus deseos con el mundo",
    redirecting: "Llevándote a tus listas...",
    almostThereTitle: "¡Ya casi está!",
    almostThereMessage:
      "Tu registro está casi listo. ¡Muy pronto podrás terminar de configurar tu perfil!",
  },
  landing: {
    iframeTitle: "Contenido de Wishin — Funciones y primeros pasos",
    iframeLabel: "Contenido de la página de inicio de Wishin",
    tryApp: {
      title: "Prueba la app",
      body: "Wishin todavía no está en Google Play ni en la App Store, ¡pero estamos en ello! Mientras tanto, puedes instalar la app de Android directamente desde nuestra última versión.",
      note: "Puede que tu móvil te pida permiso para instalar apps de orígenes desconocidos; es normal. La versión para iOS llegará más adelante.",
      download: "Descargar APK",
    },
    addToHome: {
      titleIos: "Añadir a pantalla de inicio",
      titleMacos: "Añadir al Dock",
      intro:
        "Wishin aún no está en la App Store, ¡pero ya puedes tenerla como una app más! Así de fácil:",
      ios: {
        step1:
          "Toca el botón Compartir de tu navegador (en Safari puede estar dentro del menú •••).",
        step2: "Desplázate hacia abajo y toca «Añadir a pantalla de inicio».",
        step3:
          "Toca «Añadir». ¡Listo! Wishin aparecerá en tu pantalla de inicio como cualquier otra app.",
      },
      macos: {
        step1: "Abre esta página en Safari.",
        step2: "En la barra de menús, elige Archivo → Añadir al Dock.",
        step3:
          "Haz clic en «Añadir». ¡Listo! Wishin se abrirá en su propia ventana desde el Dock.",
      },
    },
  },
  dashboard: {
    createTitle: "Crea tu lista de deseos",
    addItem: "Añadir artículo",
    editItem: "Editar artículo",
    shareWishlist: "Compartir lista",
    editWishlist: "Editar lista",
    actionsA11y: "Acciones de la lista",
    closeItemModalA11y: "Cerrar ventana del artículo",
    closeEditWishlistA11y: "Cerrar ventana de edición de la lista",
    linkCopied: "¡Enlace copiado! Ya puedes compartirlo 🎉",
    shareFailedTitle: "Vaya, no hemos podido compartirla",
    shareFailedMessage:
      "No hemos podido copiar el enlace de tu lista. ¿Lo intentamos otra vez?",
    emptyTitle: "Tu lista todavía está vacía... ¡por ahora!",
    emptySubtitle: "Pulsa el botón de abajo y añade tu primer deseo ✨",
    ownerFallback: "Tú",
    editAvatarA11y: "Editar foto de perfil",
    editUsernameA11y: "Editar nombre de usuario",
    removeItem: {
      title: "Eliminar artículo",
      message: "¿Seguro que quieres quitar este deseo de tu lista?",
      confirm: "Eliminar",
      noWishlist:
        "No hemos encontrado tu lista, así que no podemos eliminarlo.",
      failed: "Vaya, no hemos podido eliminarlo. ¿Lo intentamos otra vez?",
    },
    username: {
      dialogTitle: "Editar nombre de usuario",
      required: "¡Dinos cómo quieres que te llamemos! 😊",
      length:
        "Tu nombre de usuario necesita entre 3 y 30 caracteres. ¡Corto y bonito! ✨",
      format: "Usa solo letras, números, espacios y .-_ ¡Mejor sencillito! 🖋️",
      failed:
        "¡Vaya! No hemos podido cambiar tu nombre de usuario. ¿Lo intentamos otra vez? 🛠️",
    },
  },
  wishlistForm: {
    titleLabel: "Título*",
    titlePlaceholder: "p. ej. Cumpleaños 2026",
    descriptionLabel: "Descripción (opcional)",
    descriptionPlaceholder:
      "Cuenta de qué va esta lista: un cumple, una boda, porque sí...",
    create: "Crear lista",
    update: "Actualizar lista",
  },
  itemForm: {
    imageA11y: "Imagen del artículo",
    nameLabel: "Nombre*",
    namePlaceholder: "¿Qué te gustaría?",
    descriptionLabel: "Descripción",
    descriptionPlaceholder: "Talla, color, modelo... cualquier pista ayuda",
    priceLabel: "Precio",
    unknownPrice: "No sé el precio",
    quantityLabel: "Cantidad",
    unlimited: "Ilimitada",
    urlLabel: "Enlace (URL)",
    priorityLabel: "Prioridad",
    add: "Añadir a la lista",
    save: "Guardar cambios",
    selectCurrency: "Elige la moneda",
    currencyOption: "{{name}} ({{code}})",
  },
  currencies: {
    euro: "Euro",
    usDollar: "Dólar estadounidense",
    britishPound: "Libra esterlina",
    japaneseYen: "Yen japonés",
  },
  priority: {
    low: "BAJA",
    medium: "MEDIA",
    high: "ALTA",
    urgent: "URGENTE",
    a11y: "Prioridad: {{label}}",
  },
  item: {
    price:
      "{{amount, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}} {{symbol}}",
    reserved: "RESERVADO",
    gotIt: "¡lo tengo!",
    viewOnlineA11y: "Ver en línea, {{name}}",
    openLinkA11y: "Abrir enlace",
    editA11y: "Editar artículo",
    deleteA11y: "Eliminar artículo",
    closeDetailsA11y: "Cerrar detalles del artículo",
    quantityShort: "Cant.: {{quantity}}",
    visitStore: "Ver en la tienda 🛍️",
    priceLabel: "Precio",
    quantityLabel: "Cantidad",
    priorityLabel: "Prioridad",
    descriptionLabel: "Descripción",
    priceNotSet: "Sin precio",
    edit: "Editar artículo",
    links: {
      couldNotOpen: "Vaya, no hemos podido abrir el enlace.",
      onlyWeb: "Solo podemos abrir enlaces web (http/https).",
      cannotOpen: "Vaya, no hemos podido abrir este enlace: {{url}}",
    },
    purchase: {
      success:
        "¡Genial! Has marcado 1 x {{name}} como comprado. ¡Qué buen regalo! 🎁",
      undone: "¡Hecho! Hemos deshecho la compra.",
      failedTitle: "Vaya, no hemos podido marcarlo",
      undoFailedTitle: "Vaya, no hemos podido deshacerlo",
      guestSessionFailed:
        "No hemos podido prepararte una sesión de invitado. ¿Lo intentamos otra vez?",
    },
  },
  publicWishlist: {
    unknownOwner: "Anónimo",
    notFound: "Vaya, no encontramos esta lista de deseos. 🤔",
    empty: "Esta lista todavía está vacía. ¡Vuelve pronto!",
  },
  spoiler: {
    title: "¡Alerta de spoiler!",
    message:
      "¡Ojo! Si sigues, podrías descubrir qué te van a regalar y adiós sorpresa. 🙈",
    confirmTitle: "¿Seguro, seguro?",
    confirmMessage:
      "Vas a verlo todo, también lo que ya está reservado o comprado. ¿Seguimos?",
  },
  loginSuggestion: {
    title: "¡Ya casi está!",
    subtitle: "¡Qué ganas de regalar!",
    heading: "¡No pierdas tu progreso!",
    body: "Tu regalo contará igual, pero como invitado solo lo recordamos en este dispositivo. Si inicias sesión, guardaremos tu historial y podrás cambiar de idea cuando quieras.",
    later: "Quizá más tarde",
    guest: "Seguir sin cuenta",
    signIn: "Iniciar sesión",
  },
  imagePicker: {
    addPhoto: "Añadir foto",
    addPhotoA11y: "Añadir foto",
    sourceTitle: "¿De dónde sacamos la foto?",
    takePhoto: "Hacer foto",
    chooseFromGallery: "Elegir de la galería",
    permissionTitle: "Necesitamos tu permiso",
    galleryPermission:
      "Para añadir fotos a tus deseos, déjanos acceder a tu galería. 📷",
    cameraPermission:
      "Para hacer fotos de tus deseos, déjanos usar la cámara. 📸",
    uploadPermission: "Para subir una foto, déjanos acceder a tu galería. 📷",
    pickFailed: "Vaya, no hemos podido coger esa imagen. ¿Probamos con otra?",
    photoFailed:
      "Vaya, no hemos podido hacer la foto. ¿Lo intentamos otra vez?",
    uploadFailedTitle: "Ups, no se ha subido",
    uploadFailedMessage:
      "No hemos podido subir la imagen. ¿Lo intentamos otra vez?",
  },
  errors: {
    nameTooShort:
      "¡Uy! Ese nombre se queda cortito. Ponle al menos 3 caracteres para que luzca en tu lista. ✨",
    nameTooLong:
      "¡Uf, qué nombre tan largo! Déjalo en menos de 100 caracteres para que quepa perfecto. 📏",
    wishlistNotFound:
      "No encontramos tu lista de deseos. ¡Prueba a recargar la página! 🔄",
    itemNotFound:
      "No encontramos ese deseo. ¡Puede que ya no esté en la lista! 🕵️",
    itemUnavailable:
      "¡Alguien se te ha adelantado! No quedan suficientes unidades de este artículo. 🎁",
    network:
      "Parece que no hay conexión. Revisa tu internet y lo volvemos a intentar. 📡",
    imageUpload:
      "La imagen se nos ha resistido. ¿Lo intentamos otra vez o guardas sin ella? 🖼️",
    unknown:
      "Ups, algo ha fallado por nuestra parte. ¿Lo intentamos otra vez? 🛠️",
  },
  errorScreens: {
    generalTitle: "Ups, algo ha salido mal",
    generalMessage:
      "Ha pasado algo que no esperábamos. Prueba a cerrar y volver a abrir la app, ¡seguro que se arregla!",
    configTitle: "Error de configuración",
    configMessage:
      "Parece que faltan algunas variables de entorno obligatorias. Comprueba que tu archivo .env tiene configuradas las credenciales de Appwrite.",
    tryAgain: "Volver a intentarlo",
  },
};
