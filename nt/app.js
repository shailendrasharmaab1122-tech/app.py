document.addEventListener('DOMContentLoaded', () => {
    // Backend Node API Endpoint (Vercel standard pattern)
    const API_ENDPOINT = '/api/get-nt-data'; 

    fetch(API_ENDPOINT)
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                renderBanners(response.data.banners);
                renderCourses(response.data.courses);
            } else {
                showError('Data parsing pipeline failed.');
            }
        })
        .catch(err => {
            console.error(err);
            showError('Failed to establish connection with Node backend.');
        });
});

function renderBanners(banners) {
    const container = document.getElementById('banner-container');
    const section = document.getElementById('banner-section');
    if (banners && banners.length > 0) {
        section.classList.remove('hidden');
        // Pehle banner ko automatically show kar rahe hain custom wrapper mein
        container.innerHTML = `<img src="${banners[0]}" alt="Live Banner" class="w-full h-auto md:h-64 object-cover">`;
    }
}

function renderCourses(courses) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = ''; // Loading text clear karna

    if (!courses || courses.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-500">No active streams or batches found.</div>`;
        return;
    }

    courses.forEach(course => {
        const cardHtml = `
            <div class="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden shadow-md hover:shadow-teal-500/10 hover:border-teal-500/50 transition-all duration-300 group cursor-pointer">
                <div class="relative overflow-hidden aspect-video bg-slate-900">
                    <img src="${course.imgUrl}" alt="${course.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-sm tracking-wide text-slate-200 line-clamp-1 group-hover:text-teal-400 transition-colors">${course.title}</h3>
                    <div class="mt-3 flex justify-between items-center">
                        <span class="text-[11px] font-medium uppercase bg-slate-700/50 text-slate-400 px-2.5 py-0.5 rounded-md">Live Data</span>
                        <button class="text-xs font-bold text-teal-400 group-hover:underline flex items-center gap-1">Launch →</button>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function showError(msg) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 bg-red-950/20 border border-red-900/50 p-4 rounded-xl">${msg}</div>`;
}
