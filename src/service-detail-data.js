// Copy is grounded in the supplied service brief and existing Next Jump media.
// Photos illustrate equipment or a named build; they are never assigned to a reviewer.
export const serviceDetailData = {
  P16: {
    icon:'suspension', title:'Lift & suspension installation.',
    intro:'A daily driver, a loaded work truck and a camper build need different suspension plans. Get yours built around the weight you carry and the roads you drive.',
    hero:'flagship-shop-suspension.webp', heroAlt:'A blue Toyota Tacoma with its suspension and off-road tires visible', heroCaption:'Tacoma suspension and off-road setup. Every installation is vehicle-specific.',
    heading:'Look beyond the lift height.', description:'Your suspension is part of a whole vehicle. Start with the load, then work through the equipment and installation together.',
    image:'flagship-dillon-f250.webp', imageAlt:'Dillon’s lifted 1993 Ford F-250 outside the shop', imageCaption:'Dillon’s 1993 F-250 · a completed Next Jump lift project', example:{to:'/pages/dillon-f250-lift-project',label:'See Dillon’s F-250 lift'},
    scope:[['The way you drive','Daily miles, trail use, towing or a camper—tell us what the truck does most.'],['The weight you carry','Include the equipment already fitted and the load you plan to add.'],['The complete setup','Review lift, tire and related fitment questions before settling on the installation.']],
    prepare:['Vehicle year, make and model','Current suspension and planned equipment','Regular load and the change you want'],
    question:'Can I bring a suspension kit I already bought?', answer:'Send the exact kit and vehicle details first. The team needs to review compatibility and confirm the installation scope before accepting the work.',
    related:['P18','P22']
  },
  P17: {
    icon:'rack', title:'Bumpers, racks & room for more.',
    intro:'Carry the gear. Make space for the adventure. Plan your bumper or rack installation around the vehicle, the equipment and how you need to reach it.',
    hero:'ute-front.jpg', heroAlt:'The Super Ute showing its front bumper and rack-mounted gear', heroCaption:'The Super Ute collaboration · bumper, rack and storage working together.',
    heading:'Everything needs a place.', description:'A rack or bumper has a job to do. The useful details are what it carries, what it clears and what it needs to work around.',
    image:'racks.png', imageAlt:'Front bumper on a Ford truck and a separate bed rack', imageCaption:'Bumpers & racks · plan the mounting points before the parts', product:true,
    scope:[['What it carries','Tents, recovery equipment and other gear help define the rack or bumper you need.'],['What it fits around','Account for lights, sensors, cameras and existing equipment.'],['How you use it','Discuss access, mounting and the installation details before confirming the parts.']],
    prepare:['Vehicle year, make and model','Exact bumper or rack, if selected','The equipment you want to carry'],
    question:'What if my rack needs a custom mounting solution?', answer:'Describe the rack and mounting problem in your inquiry. Next Jump has completed custom rack-bracket work; the team will review your specific request before confirming whether it can take it on.',
    related:['P21','P20']
  },
  P18: {
    icon:'wheel', title:'Wheels & tires for your next road.',
    intro:'From everyday driving to backcountry miles, get a wheel and tire plan that starts with your vehicle, your terrain and the work it needs to do.',
    hero:'hero.png', heroAlt:'Next Jump flatbed truck on a wooded trail', heroCaption:'A Next Jump flatbed truck. Wheel and tire fitment varies by vehicle.',
    heading:'Good looks are just the start.', description:'The right conversation goes beyond tire diameter. Bring the current setup and the driving you want it to handle.',
    image:'wheels.png', imageAlt:'An off-road tire and two wheels', imageCaption:'Wheels & tires · final fitment is reviewed for your vehicle', product:true,
    scope:[['Road & terrain','How much pavement, gravel or trail is in your week? Start with the actual driving.'],['Your current setup','Share the wheel and tire details and any existing suspension changes.'],['Fitment & installation','Review the proposed combination and related work before committing to the setup.']],
    prepare:['Vehicle year, make and model','Current tire size and suspension changes','The roads and terrain you drive'],
    question:'Can you help if I have not picked a tire size?', answer:'Yes. Start with your current setup and intended use. The team can discuss the choices and vehicle-specific fitment questions before confirming a combination.',
    related:['P16','P17']
  },
  P19: {
    icon:'power', title:'Custom power. Built for camp.',
    intro:'Fridge, lights, communications and the devices you rely on. Plan a custom power installation around what you need to run and how you travel.',
    hero:'ute-tent.jpg', heroAlt:'The Super Ute at a remote campsite at sunset', heroCaption:'The Super Ute at camp. Your power system is planned around your equipment.',
    heading:'Start with what needs power.', description:'A useful power setup begins with your equipment and the time you spend away. We’ll work through storage, charging and installation scope with you.',
    image:'power.png', imageAlt:'Solar panels, a battery and power-system components', imageCaption:'Power & charging equipment · plan it as one system', product:true,
    scope:[['What you run','List the fridge, lighting, communications and other devices you want to use.'],['How long you stay','Describe a typical trip, time at camp and the driving between stops.'],['How it comes together','Discuss charging, equipment placement and the installation around your vehicle.']],
    prepare:['Vehicle and existing electrical equipment','Devices you need to power','Typical trip length and time at camp'],
    question:'Can this be added to an existing build?', answer:'Tell us what is already installed, including any batteries, charging equipment and solar panels. The team will review the existing system and intended use before recommending a scope.',
    related:['P20','P22']
  },
  P20: {
    icon:'light', title:'Lighting for the trail. And camp.',
    intro:'See where you’re going and what you’re doing. Plan lights, mounting, wiring and controls around the jobs you need them to do.',
    hero:'tent.jpg', heroAlt:'Toyota 4Runner with roof and bumper-mounted lights on a forest trail', heroCaption:'A 4Runner equipped with roof and bumper lighting.',
    heading:'Put the light where you need it.', description:'A trail, a work area and a campsite ask different things of your lights. Build the installation around the task.',
    image:'lighting.png', imageAlt:'A selection of round driving lights, a light bar and work lights', imageCaption:'Lighting options · placement, mounting and controls matter', product:true,
    scope:[['The job','Tell us where you want light: a trail, a work area, camp or another part of the vehicle.'],['The mounting','Review the space available and any racks, bumpers or equipment already fitted.'],['The controls','Plan switching and wiring as part of the installation, not an afterthought.']],
    prepare:['Vehicle and existing racks or bumpers','The areas you want to illuminate','Selected lights or existing wiring'],
    question:'Can you install lights I already own?', answer:'Share the exact product and vehicle details, along with any existing wiring or switches. The team will review the combination before confirming installation.',
    related:['P17','P19']
  },
  P21: {
    icon:'tent', title:'Your rooftop tent. Properly planned.',
    intro:'Turn the vehicle you love into a place to stay. Work through the tent, rack and mounting details before the installation.',
    hero:'tent.jpg', heroAlt:'Toyota 4Runner carrying a closed James Baroud rooftop tent', heroCaption:'James Baroud rooftop tent on a 4Runner.',
    heading:'Think about travel. And arrival.', description:'The tent needs to work on the road and when you open it at camp. Plan the complete combination before picking the final setup.',
    image:'ute-tent.jpg', imageAlt:'The Super Ute with a rooftop tent open at a golden-hour campsite', imageCaption:'The Super Ute collaboration · rooftop tent deployed at camp',
    scope:[['Tent & rack','Start with the exact models, or tell us which combination you are considering.'],['Packed for travel','Review the vehicle, mounting requirements and the other gear sharing the space.'],['Opened at camp','Consider ladder access, opening clearance and the space you need around the vehicle.']],
    prepare:['Vehicle year, make and model','Tent and rack model, if selected','Existing equipment around the roof or bed'],
    question:'Do I have to buy the tent before talking to you?', answer:'No. A model you are considering is enough to start. The team can review the proposed tent, rack and vehicle combination before you finalize your installation plan.',
    related:['P17','P19']
  },
  P22: {
    icon:'camper', title:'Alaskan camper installation.',
    intro:'Bring the truck and camper together. Plan the mounting, supporting equipment and installation around your Alaskan camper and the way you want to travel.',
    hero:'camper.jpg', heroAlt:'Alaskan camper mounted on a Next Jump flatbed truck', heroCaption:'Alaskan camper on a Next Jump flatbed.',
    heading:'One truck. One considered setup.', description:'The camper is a starting point. Storage, power and the truck itself belong in the same installation conversation.',
    image:'camper.jpg', imageAlt:'Alaskan camper mounted on a Next Jump flatbed', imageCaption:'Alaskan camper on a Next Jump flatbed · a photographed setup', example:{to:'/pages/alaskan-camper-flatbed-setup',label:'Explore this camper setup'},
    scope:[['The camper','Include the model, year and mounting equipment you already have.'],['The truck','Share the vehicle configuration and any existing modifications.'],['The supporting build','Talk through storage, power and the installation work that connects the setup.']],
    prepare:['Truck year, make, model and bed details','Alaskan camper model and year','Existing mounting and supporting equipment'],
    question:'Can we start while I am still choosing the camper?', answer:'Yes. Tell us which camper you are considering and the truck you want to use. A planned purchase is enough to begin reviewing the configuration.',
    related:['P16','P19']
  },
  P23: {
    icon:'wash', title:'Get the trip off your truck.',
    intro:'Vehicle washing and detailing in Tacoma. Tell us what you drive, what needs attention and how far you want to take the clean.',
    hero:'wash.png', heroAlt:'Two people hand-washing a Next Jump flatbed truck', heroCaption:'Hands-on washing at Next Jump.',
    heading:'A proper reset starts here.', description:'A weekend away and months of daily use leave different jobs behind. Set the cleaning scope around the vehicle’s actual condition.',
    image:'wash.png', imageAlt:'A flatbed truck being washed by hand outside the shop', imageCaption:'Vehicle washing · start with the areas that need attention',
    scope:[['The vehicle','Tell us the vehicle type and size so we can discuss the right service.'],['The condition','Describe the areas you want cleaned and any existing damage or concerns.'],['The appointment','Agree on the work and pricing before arranging the service.']],
    prepare:['Vehicle type and size','The areas you want addressed','Condition and preferred timing'],
    question:'Can you quote from a short description?', answer:'A description helps start the conversation. The team may need more information about the condition before confirming the cleaning scope and price.',
    related:['P24'], care:true
  },
  P24: {
    icon:'boat', title:'Boat washing & detailing.',
    intro:'Get the boat ready for its next outing. Share the size, location and condition so we can review the cleaning scope and service availability.',
    hero:'boat.png', heroAlt:'A boat hull being cleaned with a cloth', heroCaption:'Boat care · availability and scope confirmed with the team.',
    heading:'Start with the boat. And the job.', description:'Give us a clear picture of what needs attention and where the boat is located. We’ll discuss the service before arranging a visit.',
    image:'boat.png', imageAlt:'Detail view of a boat hull being cleaned', imageCaption:'Boat cleaning · service depends on scope, location and access',
    scope:[['Boat & condition','Include the size and the surfaces or areas you want addressed.'],['Location & access','Tell us where the boat is and how it can be accessed.'],['Scope & availability','Confirm the work, pricing and scheduling before booking.']],
    prepare:['Boat size and current condition','Location and access details','The work and timing you have in mind'],
    question:'Is service available at my location?', answer:'Include the boat’s location and access details in your inquiry. The team will confirm whether it can provide the requested service before arranging the work.',
    related:['P25','P23'], care:true, vessel:true
  },
  P25: {
    icon:'marine', title:'Make more of your time on the water.',
    intro:'Have a marine outfitting project in mind? Tell us about the vessel, the equipment and what you want to change. We’ll review whether the work is a fit.',
    hero:'boat.png', heroAlt:'Work taking place beside a boat hull', heroCaption:'Marine projects · scope and availability reviewed individually.',
    heading:'A clear plan before any work.', description:'Start with the problem or the equipment. The first conversation helps establish what the project needs and whether our team can take it on.',
    image:'boat.png', imageAlt:'A boat hull and a person working alongside it', imageCaption:'Marine service imagery · every project is reviewed individually',
    scope:[['The vessel','Describe the boat and share the relevant existing system details.'],['The equipment','Tell us what is installed and what you want to add or change.'],['The project','Review the requested work, availability and pricing before scheduling.']],
    prepare:['Vessel type and location','Equipment and existing system details','The change you want to make'],
    question:'Can you take on my specific marine project?', answer:'Send the vessel and equipment details first. The team needs to review the request before confirming the services it can provide, pricing or scheduling.',
    related:['P24'], vessel:true
  },
  P26: {
    icon:'trailer', title:'Bring your basecamp behind you.',
    intro:'Plan an overland trailer around the gear, storage and camp setup you want to bring. Start with the trailer and the vehicle that will tow it.',
    hero:'trailer.jpg', heroAlt:'Next Jump overland trailer with storage and an awning deployed beside a lake', heroCaption:'A Next Jump trailer setup with storage and an awning.',
    heading:'More room for the way you travel.', description:'Think through the whole camp setup, then work back to the trailer, carrying layout and tow vehicle.',
    image:'trailer.jpg', imageAlt:'Overland trailer with pull-out storage beneath an awning', imageCaption:'Trailer-based camp setup · equipment varies by project',
    scope:[['What comes along','List the camping gear, storage and equipment you need it to carry.'],['What you already own','Include the trailer details and any equipment you want to keep or add.'],['What pulls it','Bring the tow vehicle into the conversation so the project can be reviewed as a whole.']],
    prepare:['Trailer details or the model you are considering','Tow vehicle details','Gear and camp equipment you want to carry'],
    question:'Can I start with an idea instead of a finished parts list?', answer:'Yes. Describe the trips, the trailer you have or are considering, and what you want to carry. The team can review the project before confirming its scope.',
    related:['P19','P21'], trailer:true
  }
};
