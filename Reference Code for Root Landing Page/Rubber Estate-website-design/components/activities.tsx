'use client'

import Image from 'next/image'

const activities = [
  {
    title: 'Lakeside Trails',
    description: 'Scenic walking paths around the pristine lake with stunning water views and natural ecosystems to explore.',
    image: '/activity-lakeside.png',
  },
  {
    title: 'Recreational Areas',
    description: 'Family-friendly spaces with recreational activities, perfect for groups and celebrations in nature.',
    image: '/activity-playground.png',
  },
  {
    title: 'Botanical Gardens',
    description: 'Beautiful gardens showcasing rare plants and horticultural wonders throughout the park.',
    image: '/activity-botanical.png',
  },
]

export default function Activities() {
  return (
    <section id="activities" className="py-20 px-4 bg-[#E8EFE9]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-cormorant text-5xl md:text-6xl font-bold text-[#1E3F20] text-center mb-4">
          Park Activities
        </h2>
        <p className="text-center text-[#2C302E] mb-12 max-w-2xl mx-auto">
          Beyond the culinary experience, discover the natural wonders surrounding our bistro
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E0DDD8]"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={activity.image}
                  alt={activity.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-[#1E3F20] text-xl mb-3">
                  {activity.title}
                </h3>
                <p className="text-[#2C302E]/70 leading-relaxed">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
