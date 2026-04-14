"use client";
import { usePricing } from "@/lib/admin/usePricing";
import { formatSeconds, MODULE_COLORS } from "@/lib/admin/pricingData";
import styles from "@/styles/admin/pricing.module.css";

function PlanBadge({ tier }) {
  const color = tier === "pro" ? "#059669" : "#64748b";
  return (
    <span className={styles.badge} style={{
      background: color + "18",
      color,
      border: `1px solid ${color}33`,
    }}>
      {tier}
    </span>
  );
}

function PlanCard({ plan }) {
  const priceColor = plan.tier === "pro" ? "#059669" : "#64748b";
  return (
    <div className={styles.planCard}>
      <div className={styles.planHeader}>
        <div>
          <div className={styles.planName}>{plan.name}</div>
          <PlanBadge tier={plan.tier} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={styles.planPrice} style={{ color: priceColor }}>
            {plan.price === 0 ? "Free" : `$${plan.price}`}
          </div>
          {plan.billing && (
            <div className={styles.planBilling}>/{plan.billing}</div>
          )}
        </div>
      </div>

      <div className={styles.planFeatures}>
        {plan.features.map((f, i) => (
          <div key={i} className={styles.planFeature}>
            <span className={styles.featureCheck}>✓</span>
            {f}
          </div>
        ))}
      </div>

      {plan.lemonsqueezy_variant_id && (
        <div className={styles.variantId}>
          Variant ID: {plan.lemonsqueezy_variant_id}
        </div>
      )}
    </div>
  );
}

function PlansSection({ plans }) {
  return (
    <div>
      <h2 className={styles.heading}>Subscription plans</h2>
      <div className={styles.plansGrid}>
        {plans.map(plan => (
          <PlanCard key={plan.tier} plan={plan} />
        ))}
      </div>
      <div className={styles.notice}>
        To change prices, update your variant in the LemonSqueezy dashboard
        and update LEMONSQUEEZY_PRO_VARIANT_ID in your .env file.
      </div>
    </div>
  );
}

function LimitTile({ module, seconds }) {
  const color = MODULE_COLORS[module] || "#6366f1";
  return (
    <div className={styles.limitTile}>
      <div className={styles.limitLabel}>{module}</div>
      <div className={styles.limitValue} style={{ color }}>
        {formatSeconds(seconds)}
      </div>
      <div className={styles.limitSub}>{seconds}s</div>
    </div>
  );
}

function TimeLimitsSection({ limits }) {
  return (
    <div>
      <h2 className={styles.heading}>Module time limits</h2>
      <div className={styles.limitsCard}>
        <div className={styles.limitsGrid}>
          {Object.entries(limits).map(([mod, secs]) => (
            <LimitTile key={mod} module={mod} seconds={secs} />
          ))}
        </div>
        <div className={styles.notice}>
          To change time limits, update the *_TIME_LIMIT values in your
          .env file and restart the server.
        </div>
      </div>
    </div>
  );
}

export function PricingTab() {
  const { pricing, limits, loading } = usePricing();

  if (loading) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.container}>
      {pricing && <PlansSection plans={pricing.plans} />}
      {limits  && <TimeLimitsSection limits={limits} />}
    </div>
  );
}