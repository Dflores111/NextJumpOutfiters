// Curated planning copy, not approved sellable product/variant or fitment records.
// Commercial facts are resolved by the server Product Master, never by React.
export const catalogVersion = 'planning-2026-10-07.1';
export const planningProducts = [
  {id:'base',name:'Aluminum flatbed',category:'Foundation',image:'base-2.jpg',description:'An open, modular foundation. Your truck determines the platform and mounting details.',reason:'Start with usable deck space. The team confirms the platform and mounting.',price:null,status:'PENDING_REVIEW'},
  {id:'headache',name:'Cab protection rack',category:'Carry',image:'headache-0.jpg',description:'A rack behind the cab. Ask the team to review it with your load and camper plans.',reason:'Consider it when carrying equipment behind the cab. Clearance needs review.',price:null,status:'PENDING_REVIEW'},
  {id:'sides',name:'Removable sides',category:'Carry',image:'sides-2.jpg',description:'Sides for a contained load area, with open access when removed.',reason:'For a more contained deck. Dropsides are a separate option in the supplied parts list.',price:null,status:'PENDING_REVIEW'},
  {id:'tailgate',name:'Tailgate upgrade',category:'Carry',image:'tailgate-0.jpg',description:'A rear closure to review with your sides and any camper or topper.',reason:'Plan the rear opening around what you carry and how you access it.',price:null,status:'PENDING_REVIEW'},
  {id:'boxes',name:'Upper storage boxes',category:'Storage',image:'boxes-1.jpg',description:'Accessible storage above the deck. Required when considering the kitchen insert.',reason:'Give gear a place you can reach without unloading the deck.',price:null,status:'PENDING_REVIEW'},
  {id:'underbody',name:'Rear underbody storage',category:'Storage',image:'underbody-0.jpg',description:'Make use of space below the flatbed, subject to vehicle clearance and mounting review.',reason:'Keep the deck open while adding storage below. Clearances matter.',price:null,status:'PENDING_REVIEW'},
  {id:'kitchen',name:'Camp kitchen insert',category:'Camp',image:'kitchen-0.jpg',description:'A pull-out kitchen insert for upper storage boxes. Both components need a fitment review.',reason:'For cooking from the truck. Upper storage boxes are required in the plan.',requires:'boxes',price:null,status:'PENDING_REVIEW'},
];
export const upgradeIntents = [
  {id:'suspension',name:'Lifts & suspension',group:'Ride & handling',image:'flagship-dillon-f250.webp',service:'suspension',description:'Plan the ride around the truck and the load.',reason:'Tell us what stays on the vehicle and how the truck feels now. The team specifies springs, dampers and geometry.'},
  {id:'wheels-tires',name:'Wheels & tires',group:'Wheels & protection',image:'services-hero.jpg',service:'wheels-tires',description:'Match the setup to the roads you travel.',reason:'Tire size, clearance, wheel specifications and the suspension need to be reviewed together.'},
  {id:'bumpers-racks',name:'Bumpers & racks',group:'Wheels & protection',image:'services-hero.jpg',service:'bumpers-racks',description:'Make room for protection and carrying gear.',reason:'Consider the equipment you carry, access and the weight added to the truck.'},
  {id:'power',name:'Power & electrical',group:'Light & power',image:'power.jpg',service:'power',description:'Keep the essentials powered at camp.',reason:'Start with the devices you use and time away from charging. The team plans power and wiring.'},
  {id:'lighting',name:'Lighting',group:'Light & power',image:'lighting.jpg',service:'lighting',description:'Put light where the job needs it.',reason:'Driving, working and camping need different placement and controls.'},
  {id:'rooftop-tent',name:'Rooftop tent setup',group:'Camp equipment',image:'ute-tent.jpg',service:'rooftop-tent',description:'Build a campsite around your vehicle.',reason:'Review the tent, carrying setup and access together before choosing the hardware.'},
];
export const startingPlans = [
  {id:'open-deck',kind:'flatbed',name:'Open deck',line:'Space for whatever comes next.',description:'Start with the platform. Keep the deck open and add only what matters.',image:'base-2.jpg',use:'Daily use & weekends',defaults:[],priorities:['Open deck','Modular options'],status:'PLANNING_ONLY'},
  {id:'cargo',kind:'flatbed',name:'Tools & cargo',line:'A place for the gear you use.',description:'Start with storage above and below the deck. Adjust around your workday.',image:'work.png',use:'Work & hauling',defaults:['boxes','underbody'],priorities:['Accessible storage','Open loading space'],status:'PLANNING_ONLY'},
  {id:'camp',kind:'flatbed',name:'Camp setup',line:'Less unpacking. More outside.',description:'Explore storage and a kitchen insert as a starting point for camp.',image:'kitchen-0.jpg',use:'Longer overland trips',defaults:['boxes','kitchen'],priorities:['Upper storage','Kitchen insert'],status:'PLANNING_ONLY'},
  {id:'camper-platform',kind:'flatbed',name:'Camper platform',line:'Bring the truck and camper together.',description:'Start with the platform. Review support, mounting and access around your camper.',image:'camper.jpg',use:'Camper setup',defaults:[],priorities:['Camper support review','Storage and access'],status:'PLANNING_ONLY'},
  {id:'weekender',kind:'vehicle',name:'Weekender',line:'Ready for Friday.',description:'A daily driver with dirt roads and weekends on the calendar.',image:'services-hero.jpg',use:'Daily use & weekends',defaults:['suspension'],priorities:['Ride & handling','Weekend use'],status:'PLANNING_ONLY'},
  {id:'overlander-light',kind:'vehicle',name:'Overlander Light',line:'Load up for the trip.',description:'For gear that goes on before the trip and comes off when you get home.',image:'ute-tent.jpg',use:'Longer overland trips',defaults:['suspension','wheels-tires'],priorities:['Occasional trip load','Multi-day travel'],status:'PLANNING_ONLY'},
  {id:'overlander-heavy',kind:'vehicle',name:'Overlander Heavy',line:'Built around what stays onboard.',description:'For a truck that carries its drawers, armor, racks or camp gear every day.',image:'hero.png',use:'Longer overland trips',defaults:['suspension','bumpers-racks'],priorities:['Permanent equipment','Loaded vehicle review'],status:'PLANNING_ONLY'},
  {id:'expedition',kind:'vehicle',name:'Expedition',line:'Go farther. Stay out longer.',description:'Plan longer, remote trips around power, carrying equipment and self-sufficiency.',image:'camper.jpg',use:'Longer overland trips',defaults:['suspension','power','lighting'],priorities:['Remote travel','Custom scope review'],status:'PLANNING_ONLY'},
];
export const optionGroups = {
  flatbed:[{id:'Carry',title:'How do you carry it?',description:'Contain the load, protect the cab or plan the rear opening.'},{id:'Storage',title:'Give the essentials a place.',description:'Choose access above or below the deck.'},{id:'Camp',title:'Make camp work for you.',description:'Explore a kitchen without rebuilding your whole plan.'}],
  vehicle:[{id:'Ride & handling',title:'Start with the ride.',description:'Plan around what the truck carries and where it goes.'},{id:'Wheels & protection',title:'Build the stance around the job.',description:'Review tires, clearance, protection and carrying equipment together.'},{id:'Light & power',title:'Keep going after sunset.',description:'Plan the light and power you need at camp or on the trail.'},{id:'Camp equipment',title:'Make the vehicle your basecamp.',description:'Start with how you want to camp. The team handles the hardware.'}]
};
export const upgradeModels={Toyota:['Tacoma','Tundra','4Runner','FJ Cruiser'],Ford:['Ranger','F-150','F-250/350','Super Duty'],Chevrolet:['Colorado','Silverado'],Jeep:['Wrangler','Gladiator JT'],Ram:['Ram 1500','Ram 2500','Heavy Duty'],Nissan:['Frontier','Titan','Xterra'],Lexus:['GX460/470']};

export function publicPlanningCatalog(){return {version:catalogVersion,mode:'planning',products:planningProducts,plans:startingPlans,upgrades:upgradeIntents,groups:optionGroups,upgradeModels,commercialStatus:'REQUIRES_APPROVAL'};}
export function recommendPlan(kind,answers={}){
  let id,reason;
  if(kind==='vehicle'){
    if(answers.trips==='remote'){id='expedition';reason='You’re planning remote or longer trips. Start with a custom scope for power, carrying equipment and the vehicle’s load.';}
    else if(answers.load==='permanent'){id='overlander-heavy';reason='Your equipment stays onboard. Heavy starts the conversation around that permanent load, rather than an occasionally loaded truck.';}
    else if(answers.trips==='multi-day'){id='overlander-light';reason='You load up for multi-day trips, then run lighter between them. Light is the closest planning direction.';}
    else {id='weekender';reason='You use the vehicle daily and head out on weekends. Start with the ride and add only the upgrades you want.';}
  }else{
    if(answers.priority==='camper'){id='camper-platform';reason='The camper sets the direction. Start with support, mounting and access before choosing storage.';}
    else if(answers.priority==='camp'){id='camp';reason='You want a simpler camp routine. Start with storage and a kitchen, then adjust the layout.';}
    else if(answers.priority==='work'||answers.load==='permanent'){id='cargo';reason='Your equipment needs a repeatable place. Start with storage while keeping loading space in mind.';}
    else {id='open-deck';reason='You want flexibility. An open deck keeps the starting plan simple; extras remain your choice.';}
  }
  return {id,reason,needsLoadReview:answers.load==='unsure'};
}
