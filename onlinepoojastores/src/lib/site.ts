// Central place for business/contact details used across the info pages and
// footer. Edit these in ONE place and they update everywhere.
export const SITE = {
  name: 'Online Pooja Stores',
  owner: 'Santosh L',
  company: 'Provident Global Services (PGS)',
  email: 'onlinepoojastores@gmail.com',
  phone: '+91 89856 11922',
  whatsapp: '918985611922', // digits only, with country code, for wa.me links
  addressLines: [
    'Provident Global Services (PGS)',
    'Hyderabad, Telangana',
    'India',
  ],
  freeShippingOver: 999,
  supportHours: 'Mon–Sat, 10 am – 7 pm IST',
};

export const whatsappLink = (message = '') =>
  `https://wa.me/${SITE.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
