// Selected excerpts, not a live review feed. Sources and verification are retained in evidence.
export const googleReviews='https://www.google.com/maps/place/Next+Jump+Outfitters+-+Off-Road+%26+Overland+Vehicle+Shop/data=!4m7!3m6!1s0x5491ab78dd54d1b5:0xb2851323e1e14a7f!8m2!3d47.223789!4d-122.4787866!16s%2Fg%2F11t7kn5s9f!19sChIJtdFU3XirkVQRf0rh4SMThbI';
const home='https://www.nextjumpoutfitters.com/';
const installs=home+'pages/overland-off-road-installation-services-tacoma-wa';
const siteLabel='Google review · on our website';
export const reviews={
  dillon:{name:'Dillon Collins',quote:'Great communication, great pricing, and amazing quality.',topic:'1993 F-250 lift',context:'Dillon brought in a classic F-250 for a lift after struggling to find a shop willing to take on the job. His review highlights the team’s communication and care.',source:googleReviews,label:'Google review'},
  will:{name:'Will Coburn',quote:'Extremely impressed with Next Jump’s staff',topic:'Custom roof-rack brackets',context:'Will needed custom brackets for a roof rack that was no longer in production. He describes working with Pat, Cedric and Hunter on the fabrication.',source:googleReviews,label:'Google review'},
  patrick:{name:'Patrick Mulcare',quote:"I couldn't be more impressed w/ their work.",topic:'Suspension & lighting',context:'Patrick’s truck received RAS heavy-duty suspension, an LED light bar and LED work lights. His review focuses on the completed installation.',source:googleReviews,label:'Google review'},
  ryan:{name:'Ryan Baltazar',quote:'Very responsive and helpful',topic:'Help choosing truck upgrades',context:'Ryan worked with Mady and the crew to choose upgrades for his truck.',source:home,label:siteLabel},
  gerard:{name:'Gerard Matel',quote:'the installation was top notch!',topic:'Jeep JLU snorkel installation',context:'Gerard’s review is about a snorkel installed on his JLU.',source:home,label:siteLabel},
  shaun:{name:'Shaun Ryan Loanzon',quote:'Great atmosphere',topic:'The experience at the shop',context:'Shaun describes a welcoming atmosphere and professional, efficient service.',source:home,label:siteLabel},
  kelly:{name:'Kelly Varney · Adventure Built',quote:'an absolute beast of a truck.',topic:'The Super Ute collaboration',context:'Kelly’s 2017 Ford Super Duty became the Super Ute collaboration with Next Jump, Adventure Built, Flated and TRUKD. This is a build-partner endorsement.',source:home,label:'Collaboration partner · excerpt',image:'ute-front',project:true},
  luke:{name:'Luke Lamberson',quote:'They always go above and beyond with customer communication',topic:'2022 Northern Lite camper modifications',context:'Luke describes returning to Next Jump for custom modifications to a 2022 Northern Lite truck camper over several years, with particular praise for communication and service.',source:installs,label:siteLabel},
  jake:{name:'Jake Watson',quote:'I love seeing and driving this thing!',topic:'1997 Tahoe · lift, wheels & lighting',context:'Jake’s Tahoe received a four-inch lift, larger wheels and multiple lighting upgrades, with switches integrated into the dash.',source:installs,label:siteLabel},
  dennie:{name:'Dennie Jones',quote:'Perfect installation',topic:'Solar for a bus conversion',context:'Dennie brought a shuttle-bus conversion in for two large solar panels and appreciated the low-profile result and the team’s ideas.',source:installs,label:siteLabel},
  kristi:{name:'Kristi Eager',quote:'the installation took less time',topic:'Subaru Outback tow hitch',context:'Kristi needed a hitch for a bike rack on a new Outback. The review compares the completed installation time with the original estimate.',source:installs,label:siteLabel},
  kenneth:{name:'Kenneth',quote:'They paid attention to every detail, and made the truck look new again.',topic:'Exterior truck detailing',context:'After a road trip, Kenneth booked an exterior truck detail to remove insects from the grille and windshield.',source:'https://reviews.birdeye.com/car-boat-detail-by-next-jump-outfitters-169938134369451',label:'Google review · via Birdeye'}
};
// Reviews appear only in directly relevant contexts. Roof-rack fabrication is not tent-installation proof; a Northern Lite camper is not an Alaskan installation; an Outback hitch is not trailer-build proof.
export const proofByContext={
  home:['dillon','ryan'],services:['will','patrick','dennie'],flatbed:['kelly'],camper:['luke'],about:['shaun','gerard'],
  P16:['dillon','jake'],P17:['will'],P18:['jake'],P19:['dennie'],P20:['patrick'],P23:['kenneth']
};
