// The text of the Privacy Policy and the Terms of Use.
// Each section has a title and a "body". In the body, a text is a paragraph and a list is a bullet list.
// Edit the words here; the pages (pages/Legal.jsx) build themselves from this file.

export const PRIVACY = {
  title: "Privacy Policy",
  intro:
    "Spacio is a marketplace where people rent out unused spaces and others book them. This policy explains what personal information Spacio collects, how it is used, who it is shared with, and the choices you have. By using Spacio you agree to this policy.",
  sections: [
    {
      title: "Information we collect",
      body: [
        "We collect only what is needed to run the marketplace:",
        [
          "Account details: your name, email address and a password. The password is stored only in a scrambled (hashed) form, so nobody at Spacio can read it. If you sign in with Google, we receive your name, email address and Google account ID. We never receive your Google password.",
          "Profile details: your mobile number, if you choose to add one.",
          "Listing details (if you host): title, description, category, address, city, the pin you place on the map, price, photos, and the contact phone number you enter.",
          "Booking details: dates, price, booking status, and who the Host and Guest are.",
          "Messages and reviews: chat messages between a Guest and a Host about a booking, and the ratings and reviews you write.",
          "Location: if you tap “Near me” or “Use my location”, your browser asks for permission first. Your position is used for that search or map and is not saved to your account.",
          "Support chat: the questions you type to the AI support assistant.",
          "Technical data: your browser keeps a login token (in local storage) so you stay signed in. Our servers may keep basic logs, such as time, IP address and errors, to keep the service secure and working.",
        ],
        "Spacio does not take payments, so we do not receive or store any card, UPI or bank details.",
      ],
    },
    {
      title: "How we use your information",
      body: [
        [
          "To create and secure your account and sign you in.",
          "To show listings and handle bookings and approvals.",
          "To let Guests and Hosts contact each other, and to show reviews.",
          "To answer your questions through the support assistant.",
          "To prevent fraud, abuse and misuse, and to fix problems and improve Spacio.",
          "To follow the law and respond to valid legal requests.",
        ],
        "We do not sell your personal information, and we do not show third-party advertising.",
      ],
    },
    {
      title: "Information from Google sign-in",
      body: [
        "If you choose “Continue with Google”, we use your Google name and email address only to create your Spacio account and sign you in. We do not use this information for advertising, we do not sell it, and we do not share it except as described in this policy. Spacio's use of information received from Google follows the Google API Services User Data Policy, including its Limited Use rules. You can remove Spacio's access at any time in your Google Account settings.",
      ],
    },
    {
      title: "What other people can see",
      body: [
        [
          "Everyone: a listing's title, description, photos, address, map location, price and reviews, together with the Host's name and the name of the person who wrote a review.",
          "Logged-in users only: the contact phone number a Host adds to a listing.",
          "The other person in a booking: the Host sees the Guest's name on a booking request, and both can read the booking chat.",
        ],
        "Your email address and the mobile number saved on your profile are not shown to other users.",
      ],
    },
    {
      title: "Who we share information with",
      body: [
        "Spacio uses trusted services to run. They receive only what they need to do their job:",
        [
          "Google: sign-in with Google, and fonts used on our pages.",
          "Cloudinary: storing and delivering listing photos.",
          "MongoDB Atlas and our hosting provider: storing our database and running our servers.",
          "Groq: creates the answers of the AI support assistant, so it receives the text of the questions you type.",
          "OpenStreetMap and Photon: map images, and address search (the text you type into the address search box).",
        ],
        "These services have their own privacy policies. Links to Google Maps open outside Spacio and are covered by Google's policy. We may also share information when the law requires it, or to protect the safety of our users.",
      ],
    },
    {
      title: "Cookies and local storage",
      body: [
        "Spacio keeps your login in your browser's local storage rather than in cookies. Services we use, such as Google sign-in and the map providers, may set their own cookies or identifiers under their own policies.",
      ],
    },
    {
      title: "How long we keep information",
      body: [
        "We keep your information while your account is active and for as long as needed to run bookings, resolve disputes and meet legal duties. When you delete a listing, it is removed from Spacio together with its bookings, chats, reviews and photos. When you delete your account, your profile, your listings, the bookings you made, and your messages and reviews are deleted too.",
      ],
    },
    {
      title: "Security",
      body: [
        "Passwords are stored in hashed form, and we use secure connections where our hosting allows. No online service can promise perfect security, so please choose a strong password and keep it private. Never share your password, card number or OTP with anyone, including the support assistant.",
      ],
    },
    {
      title: "Your choices and rights",
      body: [
        [
          "You can change your name, email and mobile number any time on the Profile & settings page.",
          "You can edit or delete your own listings from the My spaces page.",
          "You can delete your account yourself on the Profile & settings page. This cannot be undone.",
          "You can ask us for a copy of your information, or ask us to correct it, by emailing us at the address below.",
          "You can stop using Google sign-in by removing Spacio's access in your Google Account.",
        ],
        "Depending on where you live, the law, including India's Digital Personal Data Protection Act, 2023, may give you further rights. We will do our best to respond to reasonable requests.",
      ],
    },
    {
      title: "Children",
      body: [
        "Spacio is for people who are 18 or older. We do not knowingly collect information from children. If you think a child has given us information, please contact us and we will delete it.",
      ],
    },
    {
      title: "Where information is stored",
      body: [
        "The services we use may store information on servers in India or in other countries. By using Spacio you understand that your information may be processed in those places.",
      ],
    },
    {
      title: "Changes to this policy",
      body: [
        "We may update this policy from time to time. The date at the top shows when it last changed. If the changes are important, we will tell you on Spacio. Using Spacio after a change means you accept the updated policy.",
      ],
    },
  ],
};

export const TERMS = {
  title: "Terms of Use",
  intro:
    "These Terms of Use are an agreement between you and Spacio. Please read them carefully. By creating an account or using Spacio, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use Spacio.",
  sections: [
    {
      title: "About Spacio",
      body: [
        "Spacio is an online marketplace. People who list a space (“Hosts”) can rent out unused places such as storage rooms, garages, parking spots, workspaces, event spaces, sports grounds and other spaces. People who book a space (“Guests”) can find and book them for the dates they need.",
      ],
    },
    {
      title: "Spacio's role",
      body: [
        "Spacio only provides the platform that connects Hosts and Guests. We do not own, manage, inspect, insure or control any space, and we are not a party to the rental agreement between a Host and a Guest. Hosts and Guests are responsible for their own actions, for the spaces, and for the items and vehicles involved.",
        "A listing on Spacio is not an endorsement. We do not check that listings are accurate, legal or safe, and we do not guarantee any Host or Guest.",
      ],
    },
    {
      title: "Demo listings",
      body: [
        "Some listings are marked “Demo listing”. They are added by the Spacio team to show how the app works. They are not real offers, and you should not rely on them or expect to use those spaces.",
      ],
    },
    {
      title: "Eligibility and your account",
      body: [
        [
          "You must be at least 18 years old and able to make a binding contract under Indian law.",
          "Give correct information (name, email, phone number) and keep it up to date.",
          "You can sign up with an email and password, or with Google.",
          "Keep your password safe. You are responsible for what happens on your account. Tell us quickly if you think someone else is using it.",
          "Do not create accounts to mislead others or to get around a suspension.",
        ],
      ],
    },
    {
      title: "Hosting a space",
      body: [
        "When you list a space, you promise that:",
        [
          "You own the space, or you have the right to rent it out for the use you describe (for example from the owner, landlord, housing society or employer).",
          "Your listing is honest and accurate, including the description, price, location and rules. Photos are yours, or you have permission to use them.",
          "The space is safe and legal to use for the stated purpose, and you have any permission needed (for example for events or commercial use).",
          "The phone number you add is yours, and you are happy for logged-in users to see it.",
          "You will keep your listing up to date and honour bookings you approve, or that were made with instant booking.",
          "You are responsible for any taxes on what you earn.",
        ],
        "You must not list spaces you have no right to rent, spaces that are unsafe, or spaces that will be used for anything illegal.",
      ],
    },
    {
      title: "Booking a space",
      body: [
        "A Guest chooses dates and sends a booking request, or books instantly if the Host allows it. The Host chooses whether the price is per day or per hour. For a daily price, the total is the price per day multiplied by the number of days, counting both the first and the last day. For an hourly price, the Guest picks one date and a start and end hour, and the total is the price per hour multiplied by the number of hours.",
        "If the Host must approve, the booking stays Pending until the Host approves or rejects it. When the Host approves, or when instant booking is used, the booking shows as Confirmed. Hosts and Guests should then agree directly on payment and on how the space is handed over.",
        "As a Guest you agree to:",
        [
          "Use the space only for the stated purpose and on the booked dates, and follow the Host's reasonable rules.",
          "Not let anyone else use the space, or sublet it, unless the Host agrees.",
          "Leave the space clean and as you found it, and pay for damage that you or your guests cause.",
          "Not bring illegal, dangerous or prohibited items, such as explosives, flammable or hazardous materials, stolen goods, or food that can spoil and attract pests.",
          "Not live or sleep in a storage or parking space.",
        ],
      ],
    },
    {
      title: "Prices and payments",
      body: [
        "Spacio does not take, hold or process payments. The price shown on a listing is the price the Host asks per day. Guests and Hosts agree directly how and when it is paid, and Spacio is not responsible for any payment between them.",
        "At the moment Spacio does not charge any fee or commission. If we introduce fees in future, we will show them clearly on Spacio before they apply.",
        "Be careful about paying anyone before you have seen the space, and keep a record of what you agree. We cannot help with money that was paid outside the platform.",
      ],
    },
    {
      title: "Cancellations, refunds and disputes",
      body: [
        [
          "A Guest can cancel a Pending or Confirmed booking from the My bookings page.",
          "A Host can reject a Pending booking request.",
          "Because Spacio does not handle payments, it does not handle refunds either. If money was paid, the Guest and the Host settle it between themselves.",
        ],
        "If you have a disagreement, please first try to solve it with the other person in the booking chat. Spacio may, but does not have to, help. We may remove content or suspend accounts if that is needed to keep Spacio safe and fair.",
      ],
    },
    {
      title: "Reviews, messages and other content",
      body: [
        "You own the content you post, such as listings, photos, reviews and messages. By posting it on Spacio you give us a free, non-exclusive, worldwide licence to store, show and use it to run and promote Spacio.",
        [
          "Only a Guest with a Confirmed booking can review that booking, and only once.",
          "Reviews must be honest. No fake reviews, and no reviews about a booking you did not make.",
          "Content must be lawful and must not be offensive, misleading, or include other people's private details.",
        ],
        "We may remove content that breaks these Terms.",
      ],
    },
    {
      title: "Contact details and messages",
      body: [
        "A Host's phone number is shown to logged-in users so that Guests can ask about a space. Use phone numbers and the booking chat only for matters about that listing or booking. Do not use them for spam, advertising, harassment, or to share a person's details with others.",
      ],
    },
    {
      title: "Things you must not do",
      body: [
        [
          "Break any law, or use Spacio for illegal storage, parking, events or activities.",
          "Cheat, impersonate someone, or post fake listings or reviews.",
          "Harass, threaten or discriminate against others.",
          "Upload viruses or harmful code, or try to break into or overload Spacio.",
          "Collect other people's phone numbers, emails or listings with automated tools.",
          "Misuse the support chat, for example to attack it or to send harmful or unrelated content.",
        ],
      ],
    },
    {
      title: "Safety and risk",
      body: [
        "Spacio does not visit spaces and does not check anyone's identity. Signing in with Google only shows that a person controls an email address. Please use good judgement: look at a space before leaving valuables there, think about insurance for valuable items, and meet in safe ways.",
        "Items stored, vehicles parked, and people using a space are at their owners' own risk. Spacio is not responsible for loss, theft, damage or injury connected with a rental.",
      ],
    },
    {
      title: "AI support assistant",
      body: [
        "The support chat uses artificial intelligence and can make mistakes. Its answers are general help about using Spacio. They are not legal, financial or professional advice, and they do not change these Terms. Never type passwords, card numbers or OTPs into the chat.",
      ],
    },
    {
      title: "Third-party services",
      body: [
        "Spacio works with services such as Google (sign-in), Cloudinary (photos), OpenStreetMap (maps) and Groq (the AI assistant). Their terms apply when you use them, and we are not responsible for them. Links to Google Maps open outside Spacio.",
      ],
    },
    {
      title: "Our rights",
      body: [
        "The Spacio name, logo, design and software belong to us or our licensors. You may not copy or reuse them without our permission. We may change, pause or stop any part of Spacio at any time.",
      ],
    },
    {
      title: "Suspension and ending your account",
      body: [
        "We may suspend or remove accounts, listings or content that break these Terms, put others at risk, or that we must remove by law. You can stop using Spacio at any time, and you can delete your account yourself on the Profile & settings page. Deleting your account also deletes your listings and the bookings, chats and reviews connected to it, and it cannot be undone. Terms that are meant to continue, such as those about liability and disputes, stay in effect.",
      ],
    },
    {
      title: "Disclaimers and limits of liability",
      body: [
        "Spacio is provided “as is” and “as available”. To the fullest extent the law allows:",
        [
          "We do not promise that Spacio will always work, be secure or be free of errors.",
          "We are not responsible for what Hosts and Guests do or fail to do, for the condition, safety or legality of any space, for payments between users, or for items that are lost or damaged.",
          "We are not liable for indirect or consequential losses, such as lost profit or lost business.",
          "Our total liability for any claim connected with Spacio is limited to the amount you have paid to Spacio, if any.",
        ],
        "Nothing in these Terms removes any right you have under Indian consumer law that cannot be excluded.",
      ],
    },
    {
      title: "Your responsibility for losses",
      body: [
        "To the extent the law allows, you agree to cover losses that Spacio suffers because you broke these Terms, because of content you posted, or because of a dispute between you and another user.",
      ],
    },
    {
      title: "Governing law",
      body: [
        "These Terms are governed by the laws of India. Courts in Pune, Maharashtra have jurisdiction over disputes, subject to any right you have under law to bring a claim elsewhere.",
      ],
    },
    {
      title: "Changes to these Terms",
      body: [
        "We may update these Terms from time to time. The date at the top shows when they last changed. If the changes are important, we will tell you on Spacio. Using Spacio after a change means you accept the updated Terms.",
      ],
    },
  ],
};
