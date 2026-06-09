import { LegalDocument, type LegalSection } from './legal-document';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. About Fast Motion Logistics',
    body: 'Fast Motion Logistics provides on-demand and scheduled bike delivery services across Abuja, Nigeria, focused on fast, secure, and reliable transportation of parcels, documents, and small packages.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 years old, provide accurate registration details, comply with Nigerian laws, and have the legal authority to send the items you book for delivery. Fast Motion Logistics reserves the right to suspend or terminate accounts found violating these conditions.',
  },
  {
    heading: '3. User Responsibilities',
    body: 'You must provide accurate pickup and drop-off addresses, properly package items, clearly disclose package contents, ensure the recipient is available, and treat riders professionally. Fast Motion Logistics is not liable for delays caused by inaccurate information you provide.',
  },
  {
    heading: '4. Prohibited Items',
    body: 'You may not send illegal drugs, firearms, hazardous chemicals, stolen goods, counterfeit products, improperly packaged perishables, or live animals. Fast Motion Logistics reserves the right to inspect parcels where necessary and to report illegal items to the appropriate authorities.',
  },
  {
    heading: '5. Service Coverage Area',
    body: 'Our bike delivery services are currently available within Abuja and surrounding areas. Deliveries requested outside our operational zones will not be accepted.',
  },
  {
    heading: '6. Pricing & Payments',
    body: 'Delivery fees are based on distance, package size, urgency, and traffic conditions, and may be updated without prior notice. All payments are non-refundable once a rider has arrived at the pickup location.',
  },
  {
    heading: '7. Delivery Timelines',
    body: 'Estimated delivery times are shown in the app. Delays may occur due to traffic, weather conditions, road closures, or security situations, and Fast Motion Logistics is not liable for delays outside its control.',
  },
  {
    heading: '8. Failed Delivery Policy',
    body: 'A delivery is considered failed when the recipient is unavailable, the address provided is incorrect, or the package is refused. Re-delivery or return fees may apply in these cases.',
  },
  {
    heading: '9. Cancellation Policy',
    body: 'Orders may be cancelled before a rider is dispatched without penalty. Cancellations made after a rider has been dispatched may incur a fee, and completed deliveries cannot be cancelled.',
  },
  {
    heading: '10. Liability & Compensation',
    body: 'Compensation for lost or damaged items is limited to the declared value of the item or a maximum amount determined by company policy. Claims must be submitted within 24 hours of delivery.',
  },
  {
    heading: '11. Insurance & High-Value Items',
    body: 'If you are sending high-value items, you must declare their value before dispatch. Additional insurance coverage may be required, and failure to declare value may limit any compensation owed.',
  },
  {
    heading: '12. Privacy & Data Protection',
    body: 'Your personal information is collected and processed in accordance with Nigerian data protection laws to deliver our services and improve our operations. We do not sell user data to third parties. See our Privacy Policy for full details.',
  },
  {
    heading: '13. Rider Conduct',
    body: 'Any harassment, abuse, or unsafe behaviour toward riders may result in immediate suspension of your account.',
  },
  {
    heading: '14. Dispute Resolution',
    body: 'If you have a dispute, please contact our support team through the app first. Unresolved disputes are governed by Nigerian law, with jurisdiction in Abuja.',
  },
  {
    heading: '15. Amendments',
    body: 'Fast Motion Logistics reserves the right to update this policy at any time. Continued use of the app after changes are posted constitutes acceptance of the revised terms.',
  },
  {
    heading: '16. Contact Information',
    body: 'Phone: +2347026285252\nEmail: Support@fastmotionlogistics.com.ng\nAddress: House 14, National Defence Quarters, 24th Street, Gudu, Abuja 900110, Federal Capital Territory, Nigeria',
  },
];

export function TermsOfService() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro="This User Policy outlines the terms and conditions governing the use of the Fast Motion Logistics app and bike delivery services within Abuja, Nigeria. By registering or using the app, you agree to comply with the terms below."
      sections={SECTIONS}
    />
  );
}
