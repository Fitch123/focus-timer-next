"use client";

export default function BillingTab({ subscription, lifetime, isPro }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Billing</h2>

      {isPro ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Pro
            </span>
            <span className="text-sm text-gray-600">
              {lifetime
                ? "Lifetime Access"
                : `Active — renews ${new Date(subscription?.current_period_end).toLocaleDateString()}`}
            </span>
          </div>

          {!lifetime && (
            <button className="px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50 transition">
              Cancel Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">You are on the Free plan.</p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
          >
            Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}
