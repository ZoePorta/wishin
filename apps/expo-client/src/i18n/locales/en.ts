/**
 * English translations — the source of truth for translation keys.
 * Every other locale must provide exactly the same keys (enforced by `TranslationResource`).
 */
export const en = {
  common: {
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    continue: "Continue",
    goBack: "Go Back",
    gotIt: "Got it",
    ok: "OK",
    error: "Error",
    retry: "Retry",
    tapToRetry: "Tap to Retry",
    or: "or",
    undo: "Undo",
  },
  navigation: {
    goBack: "Go back",
    goHome: "Go to home",
    myProfile: "My Profile",
  },
  header: {
    logIn: "Log In",
    logInA11y: "Log in",
    getStarted: "Get Started",
    getStartedA11y: "Get started",
    myWishlistA11y: "My wishlist",
    logoutA11y: "Logout",
  },
  auth: {
    usernameLabel: "Username",
    emailLabel: "Email",
    passwordLabel: "Password",
    togglePasswordVisibility: "Toggle password visibility",
    login: {
      title: "Welcome Back!",
      subtitle: "Hi there! Great to see you. Log in to manage your wishlists.",
      googleButton: "Sign in with Google",
      submit: "Log In",
      switchToRegister: "Don't have an account yet? Join us!",
      missingFields: "Please enter both email and password.",
      failed:
        "We couldn't log you in just now. Please check your details or try again in a moment!",
    },
    register: {
      title: "Join Wishin",
      subtitle:
        "Don't have an account yet? Join Wishin and start sharing your dreams.",
      googleButton: "Sign up with Google",
      submit: "Sign Up",
      switchToLogin: "Already have an account? Log in!",
      missingFields: "Please fill in all fields.",
      failed: "We couldn't create your account. Please try again!",
      googleFailed: "Google sign-up failed. Please try again!",
    },
    errors: {
      accountExists:
        "An account with this email already exists. Try logging in instead!",
      invalidCredentials: "Invalid credentials.",
    },
    google: {
      failed: "Google sign-in failed. Please try again!",
      accountConflict:
        "This Google account is linked to a different session open in your browser. Sign out of Wishin in your browser (or clear its site data) and try again.",
      incomplete: "Google sign-in couldn't be completed. Please try again.",
      cancelled: "Google sign-in was cancelled or failed. Please try again.",
      signInFailedTitle: "Sign In Failed",
    },
  },
  home: {
    tagline: "Share your wishes with the world",
    redirecting: "Redirecting to your dashboard...",
    almostThereTitle: "Almost there!",
    almostThereMessage:
      "Your registration is almost complete. Please wait for the profile setup feature.",
  },
  landing: {
    iframeTitle: "Wishin landing content — Features and Getting Started",
    iframeLabel: "Wishin landing content",
    tryApp: {
      title: "Try the App",
      body: "Wishin isn't available on Google Play or the App Store yet. While we get there, you can install the Android app directly from our latest release.",
      note: "Your device may ask you to allow installing apps from unknown sources. iOS is not supported yet.",
      download: "Download APK",
    },
    addToHome: {
      titleIos: "Add to Home Screen",
      titleMacos: "Add to Dock",
      intro:
        "Wishin isn't on the App Store yet, but you can use it as an app right now:",
      ios: {
        step1:
          "Tap your browser’s Share button (in Safari it may be inside the ••• menu).",
        step2: "Scroll down and tap “Add to Home Screen”.",
        step3:
          "Tap “Add”. Wishin will appear on your home screen like any other app.",
      },
      macos: {
        step1: "Open this page in Safari.",
        step2: "In the menu bar, choose File → Add to Dock.",
        step3: "Click “Add”. Wishin will open in its own window from the Dock.",
      },
    },
  },
  dashboard: {
    createTitle: "Create Your Wishlist",
    addItem: "Add Item",
    editItem: "Edit Item",
    shareWishlist: "Share Wishlist",
    editWishlist: "Edit Wishlist",
    actionsA11y: "Wishlist actions",
    closeItemModalA11y: "Close item modal",
    closeEditWishlistA11y: "Close edit wishlist modal",
    linkCopied: "Link copied to clipboard",
    shareFailedTitle: "Share Failed",
    shareFailedMessage:
      "Could not copy the wishlist link to your clipboard. Please try again.",
    emptyTitle: "Your wishlist is empty.",
    emptySubtitle: "Add your first item using the button below!",
    ownerFallback: "Owner",
    editAvatarA11y: "Edit profile picture",
    editUsernameA11y: "Edit username",
    removeItem: {
      title: "Remove Item",
      message: "Are you sure you want to remove this item?",
      confirm: "Remove",
      noWishlist: "Unable to delete: wishlist not found",
      failed: "Failed to remove the item. Please try again.",
    },
    username: {
      dialogTitle: "Edit Username",
      required: "Please enter a username so we know who you are! 😊",
      length:
        "Your username should be between 3 and 30 characters. Keep it short and sweet! ✨",
      format:
        "Only letters, numbers, spaces, and .-_ are allowed. Let's keep it simple! 🖋️",
      failed: "Oops! We couldn't update your username. Please try again. 🛠️",
    },
  },
  wishlistForm: {
    titleLabel: "Title*",
    titlePlaceholder: "e.g. Birthday 2026",
    descriptionLabel: "Description (Optional)",
    descriptionPlaceholder: "Tell people what this list is about...",
    create: "Create Wishlist",
    update: "Update Wishlist",
  },
  itemForm: {
    imageA11y: "Item image",
    nameLabel: "Name*",
    namePlaceholder: "Product name...",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Product description...",
    priceLabel: "Price",
    unknownPrice: "I don't know the price",
    quantityLabel: "Quantity",
    unlimited: "Unlimited",
    urlLabel: "Link (URL)",
    priorityLabel: "Priority",
    add: "Add to List",
    save: "Save Changes",
    selectCurrency: "Select Currency",
    currencyOption: "{{name}} ({{code}})",
  },
  currencies: {
    euro: "Euro",
    usDollar: "US Dollar",
    britishPound: "British Pound",
    japaneseYen: "Japanese Yen",
  },
  priority: {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "URGENT",
    a11y: "Priority: {{label}}",
  },
  item: {
    price:
      "{{symbol}} {{amount, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}}",
    reserved: "RESERVED",
    gotIt: "got it!",
    viewOnlineA11y: "View Online, {{name}}",
    openLinkA11y: "Open link",
    editA11y: "Edit item",
    deleteA11y: "Delete item",
    closeDetailsA11y: "Close item details",
    quantityShort: "Qty: {{quantity}}",
    visitStore: "Visit Store",
    priceLabel: "Price",
    quantityLabel: "Quantity",
    priorityLabel: "Priority",
    descriptionLabel: "Description",
    priceNotSet: "Not set",
    edit: "Edit Item",
    links: {
      couldNotOpen: "Could not open link.",
      onlyWeb: "Only web links (http/https) are supported.",
      cannotOpen: "Cannot open this link: {{url}}",
    },
    purchase: {
      success: "Awesome! You've marked 1 x {{name}} as purchased.",
      undone: "Purchase undone successfully.",
      failedTitle: "Purchase Failed",
      undoFailedTitle: "Undo Failed",
      guestSessionFailed: "Failed to create guest session.",
    },
  },
  publicWishlist: {
    unknownOwner: "Unknown",
    notFound: "Wishlist not found.",
    empty: "No items in this wishlist yet.",
  },
  spoiler: {
    title: "Spoiler Alert!",
    message:
      "Careful! Continuing might spoil the surprise of your own wishlist.",
    confirmTitle: "Are you sure?",
    confirmMessage:
      "You're about to see everything, including reserved and purchased items. Ready?",
  },
  loginSuggestion: {
    title: "Almost there!",
    subtitle: "Ready to gift?",
    heading: "Don't lose your progress!",
    body: "Your gift will be counted for the stats! However, guest info stays only on this device. Sign in to make sure you don't lose your history or the chance to change your mind later.",
    later: "Maybe later",
    guest: "Guest",
    signIn: "Sign In",
  },
  imagePicker: {
    addPhoto: "Add Photo",
    addPhotoA11y: "Add photo",
    sourceTitle: "Select Photo Source",
    takePhoto: "Take Photo",
    chooseFromGallery: "Choose from Gallery",
    permissionTitle: "Permission Required",
    galleryPermission:
      "Permission to access the photo gallery is required to add images to your items.",
    cameraPermission:
      "Permission to access the camera is required to take photos of your items.",
    uploadPermission:
      "Permission to access the photo gallery is required to upload images.",
    pickFailed: "Failed to pick an image. Please try again.",
    photoFailed: "Failed to take a photo. Please try again.",
    uploadFailedTitle: "Upload Failed",
    uploadFailedMessage: "Could not upload the image. Please try again.",
  },
  errors: {
    nameTooShort:
      "Oops! The name is a bit too short. It needs at least 3 characters to look great on your list! ✨",
    nameTooLong:
      "Whoa! That's a long name. Try keeping it under 100 characters so it fits perfectly! 📏",
    wishlistNotFound:
      "We couldn't find your wishlist. Please try refreshing the page! 🔄",
    itemNotFound:
      "Couldn’t find that wishlist item. It might have been removed! 🕵️‍♂️",
    itemUnavailable:
      "Someone got there first! There aren't enough units of this item left. 🎁",
    network:
      "It seems like there's a connection issue. Please check your internet and try again! 📡",
    imageUpload:
      "We had some trouble with the image. Want to try again or save without it? 🖼️",
    unknown: "Something went wrong on our end. Could you please try again? 🛠️",
  },
  errorScreens: {
    generalTitle: "Something went wrong",
    generalMessage:
      "An unexpected error occurred. Please try restarting the application.",
    configTitle: "Configuration Error",
    configMessage:
      "It seems like some required environment variables are missing. Please ensure your .env file is correctly configured with Appwrite credentials.",
    tryAgain: "Try Again",
  },
};
