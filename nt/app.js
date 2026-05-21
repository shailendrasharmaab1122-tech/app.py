document.addEventListener('DOMContentLoaded', () => {
    // Local routing for Vercel Serverless proxy
    const API_ENDPOINT = '/api/get-nt-data'; 

    fetch(API_ENDPOINT)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
            return res.json();
        })
        .then(response => {
            if (response.success && response.data) {
                renderBanners(response.data.banners);
                renderCourses(response.data.courses);
            } else {
                showError(response.message || 'Data integrity parse failure.');
            }
        })
        .catch(err => {
            console.error(err);
            showError('Failed to pipe response from Serverless Function.');
        });
});

function renderBanners(banners) {
    const container = document.getElementById('banner-container');
    const section = document.getElementById('banner-section');
    
    if (banners && banners.length > 0) {
        section.classList.remove('hidden');
        container.innerHTML = `
            <img src="${banners[0]}" alt="Featured Announcement" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent"></div>
        `;
    }
}

function renderCourses(courses) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = ''; // Clear fallback states

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                No target arrays detected inside JSON schema.
            </div>`;
        return;
    }

    courses.forEach(course => {
        // Safe stringification for event parameters if needed later
        const targetUrl = course.streamUrl || '#';
        
        const cardHtml = `
            <div onclick="window.open('${targetUrl}', '_blank')" class="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/[0.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between">
                <div>
                    <div class="relative aspect-video bg-slate-950 overflow-hidden">
                        <img src="${course.imgUrl}" alt="${course.title}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" loading="lazy">
                        <div class="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-800">
                            Batch
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-xs md:text-sm tracking-wide text-slate-200 line-clamp-2 group-hover:text-teal-400 transition-colors duration-200">${course.title}</h3>
                    </div>
                </div>
                <div class="px-4 pb-4 pt-0">
                    <div class="w-full h-[1px] bg-slate-800/60 mb-3"></div>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Resource Ready</span>
                        <span class="text-xs font-bold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Explore →</span>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function showError(msg) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = `
        <div class="col-span-full max-w-md mx-auto text-center bg-red-500/5 border border-red-500/10 p-5 rounded-xl">
            <p class="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Execution Interrupted</p>
            <p class="text-xs text-slate-400">${msg}</p>
        </div>`;
}
