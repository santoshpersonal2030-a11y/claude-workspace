// Central place for business/contact details used across the info pages and
// footer. Edit these in ONE place and they update everywhere.
export const SITE = {
  name: 'Online Pooja Stores',
  owner: 'Santosh L',
  company: 'Provident Global Services (PGS)',
  email: 'onlinepoojastores@gmail.com',
  // TODO: replace the placeholders below with your real number before launch.
  phone: '+91 90000 00000',
  whatsapp: '919000000000', // digits only, with country code, for wa.me links
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
