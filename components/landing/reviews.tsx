import { Star } from 'lucide-react';

export default function Reviews() {
  return (
    <section className="py-20 bg-[#F7F4EF]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-full shadow-sm border border-[#E0DDD8]">
            <Star className="w-12 h-12 text-[#E67E22] fill-current" />
          </div>
        </div>
        <h2 className="font-cormorant text-4xl md:text-5xl font-bold text-[#1E3F20] mb-6">
          See What Our Guests Say
        </h2>
        <p className="text-[#2C302E]/80 text-lg mb-8 max-w-2xl mx-auto">
          We love hearing from you! Visit our Google profile to see reviews from our wonderful guests, or leave one of your own to let us know about your experience at Rubber Estate.
        </p>
        <a
          href="https://maps.app.goo.gl/MjJ8URoN67eyp2hA7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#1E3F20] text-white rounded-xl hover:bg-[#2C5730] transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
        >
          <Star className="w-5 h-5 fill-current" />
          Read Reviews on Google
        </a>
      </div>
    </section>
  );
}
