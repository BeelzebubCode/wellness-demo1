/**
 * Loading skeleton for BookingLayout
 * Shows during Suspense boundary loading
 */
export function BookingLayoutSkeleton() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Skeleton */}
            <div className="hidden md:block w-64 bg-white border-r border-slate-200">
                <div className="p-6 space-y-4 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded"></div>
                    <div className="space-y-2">
                        <div className="h-10 bg-slate-100 rounded"></div>
                        <div className="h-10 bg-slate-100 rounded"></div>
                        <div className="h-10 bg-slate-100 rounded"></div>
                        <div className="h-10 bg-slate-100 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col">
                {/* Header Skeleton */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 animate-pulse">
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    <div className="ml-auto h-8 w-8 bg-slate-200 rounded-full"></div>
                </div>

                {/* Page Content Skeleton */}
                <div className="flex-1 p-6 space-y-4 animate-pulse">
                    <div className="h-12 bg-white rounded-xl shadow-sm"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-white rounded-xl shadow-sm"></div>
                        <div className="h-32 bg-white rounded-xl shadow-sm"></div>
                        <div className="h-32 bg-white rounded-xl shadow-sm"></div>
                    </div>
                    <div className="h-64 bg-white rounded-xl shadow-sm"></div>
                </div>
            </div>
        </div>
    );
}
