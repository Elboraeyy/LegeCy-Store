import React from 'react';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#F6E5C6] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#12403C]">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-sm border border-[#12403C]/10">
        <h1 className="text-3xl font-bold mb-8 border-b border-[#12403C]/20 pb-4">User Data Deletion Instructions</h1>
        
        <div className="space-y-6 text-lg leading-relaxed opacity-90">
          <p>LegaCy Login is a Facebook login app and we do not save your personal data in our server. According to Facebook policy, we must provide User Data Deletion Callback URL or Data Deletion Instructions URL.</p>
          
          <p>If you want to delete your activities for the LegaCy App, you can remove your information by following these steps:</p>

          <ol className="list-decimal pl-5 mt-4 space-y-3 font-medium">
            <li>Go to your Facebook Account&apos;s Setting & Privacy. Click &quot;Settings&quot;.</li>
            <li>Look for &quot;Apps and Websites&quot; and you will see all of the apps and websites you linked with your Facebook.</li>
            <li>Search and Click &quot;LegaCy&quot; in the search bar.</li>
            <li>Scroll and click &quot;Remove&quot;.</li>
            <li>Congratulations, you have successfully removed your app activities.</li>
          </ol>

          <div className="mt-8 p-4 bg-[#12403C]/5 rounded border border-[#12403C]/10">
            <h3 className="text-lg font-semibold mb-2">Request Complete Data Wipe</h3>
            <p>If you wish to have your account and all associated data permanently deleted from our systems, please email us directly at:</p>
            <p className="mt-2 text-xl font-bold text-[#D4AF37]">info@legecy.store</p>
            <p className="text-sm mt-2 opacity-75">Please include &quot;Data Deletion Request&quot; in the subject line.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
