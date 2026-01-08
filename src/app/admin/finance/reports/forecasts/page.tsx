'use client';



export default function ForecastsReportPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Financial Forecasts</h1>
            <div className="bg-white p-8 rounded-xl border text-center py-20">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-medium mb-2">Forecasting Engine</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    AI-driven cash flow and sales predictions are being generated.
                </p>
                <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg inline-block">
                    Coming Soon: Linear Regression Sales Model
                </div>
            </div>
        </div>
    );
}
