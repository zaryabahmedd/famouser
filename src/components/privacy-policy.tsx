import { LegalDocument, type LegalSection } from './legal-document';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Introduction',
    body: 'Fast Motion Logistics Ltd is committed to protecting your privacy and personal data. This policy explains how we collect, use, disclose, store, and safeguard your information when you use our mobile apps, website, and related services.\n\nIt applies to all platform users — riders, drivers, dispatch riders, customers, delivery partners, and visitors — and is designed to comply with the Nigeria Data Protection Regulation (NDPR), the Google Play User Data Policy, and other applicable privacy laws.',
  },
  {
    heading: 'Information We Collect',
    body: 'Personal information: full name, phone number, email address, residential address, profile photograph, date of birth, government-issued identification, login credentials, bank account details, payment information, and emergency contact information.\n\nRider, driver & delivery partner information: driver’s licence details, vehicle information and registration documents, insurance information, verification documents, trip history, ratings and reviews, and real-time GPS location data.\n\nCustomer information: pickup and destination addresses, ride requests and booking history, delivery information, communication records, ratings and feedback, and transaction history.\n\nAutomatically collected information: IP address, device identifiers, device type and operating system, browser type, mobile network information, app version, usage statistics, crash reports, and cookies.',
  },
  {
    heading: 'Location Information',
    body: 'The app collects precise GPS location data while in use, and — where permitted — in the background during active rides or deliveries, to enable ride matching, real-time tracking, navigation, fare calculation, pickup accuracy, safety measures, and emergency support.\n\nApproximate location derived from your IP address or network signals helps show nearby services and improves regional functionality.\n\nLocation data may be shared with the parties involved in your delivery, mapping providers, cloud hosting services such as Firebase, payment processors, and law enforcement when legally required. We do not sell location data to third parties.\n\nYou can manage location permissions from your device settings, though disabling them may limit some app features.',
  },
  {
    heading: 'How We Use Your Information',
    body: 'We use your information to provide transportation and delivery services, match riders with customers, process bookings and payments, verify identities, improve app functionality, personalise your experience, detect fraud and security threats, provide customer support, send notifications, and comply with legal obligations.',
  },
  {
    heading: 'Data Sharing',
    body: 'We share information with riders, drivers, customers, payment processors, identity verification providers, cloud storage services, customer support providers, and regulatory agencies when legally required. We do not sell your personal information to advertisers.',
  },
  {
    heading: 'Data Retention',
    body: 'We retain personal information only for as long as necessary to provide our services, maintain records, resolve disputes, prevent fraud, and meet legal requirements. You may request deletion of your account and data, subject to legal constraints.',
  },
  {
    heading: 'Data Security',
    body: 'We use administrative, technical, and physical safeguards to protect your information. However, no method of electronic transmission or storage is completely secure.',
  },
  {
    heading: 'Cookies & Tracking',
    body: 'Cookies, SDKs, and similar tracking technologies help us maintain functionality, improve analytics, remember your preferences, and enhance security. Third-party tools such as Firebase operate under their own privacy policies.',
  },
  {
    heading: 'Your Rights',
    body: 'You may access your personal information, correct inaccurate data, withdraw consent, request deletion, object to processing, and request data portability. Submit requests using the contact details below.',
  },
  {
    heading: 'Children’s Privacy',
    body: 'Our app is not directed at users under the age of 18, and we do not knowingly collect information from minors.',
  },
  {
    heading: 'Third-Party Services',
    body: 'Our platform includes links to payment gateways, mapping services, and Firebase. We are not responsible for the privacy practices of these third parties.',
  },
  {
    heading: 'International Data Transfers',
    body: 'Your information may be stored or processed outside Nigeria where necessary, with appropriate safeguards in place.',
  },
  {
    heading: 'Policy Updates',
    body: 'We may update this policy from time to time. Changes will be posted with an updated effective date, and continued use of the platform constitutes acceptance of the revised policy.',
  },
  {
    heading: 'Contact Us',
    body: 'Email: privacy@fastmotionlogisticsltd.com\nSupport: support@fastmotionlogisticsltd.com\nPhone: +2347026285252',
  },
];

export function PrivacyPolicy() {
  return <LegalDocument title="Privacy Policy" sections={SECTIONS} />;
}
