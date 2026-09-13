'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CharacterAttributes,
  AttributeKey,
  VALID_ATTRIBUTES,
  ATTRIBUTE_METADATA,
  incrementAttribute,
} from '@/lib/attributes';

interface AttributeManagerProps {
  userId: string;
  initialAttributes: CharacterAttributes;
}

export default function AttributeManager({
  userId,
  initialAttributes,
}: AttributeManagerProps) {
  const router = useRouter();
  const [attributes, setAttributes] = useState<CharacterAttributes>(initialAttributes);
  const [upgradingAttr, setUpgradingAttr] = useState<AttributeKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleIncrement = async (attr: AttributeKey) => {
    setUpgradingAttr(attr);
    setError(null);
    setSuccess(null);

    // Optimistic update
    const prevAttributes = { ...attributes };
    setAttributes((prev) => ({
      ...prev,
      [attr]: prev[attr] + 1,
    }));

    try {
      const supabase = createClient();
      const { attributes: updated, error: incrementError } = await incrementAttribute(
        supabase,
        userId,
        attr,
        1
      );

      if (incrementError || !updated) {
        // Rollback
        setAttributes(prevAttributes);
        setError(incrementError || `Failed to upgrade ${ATTRIBUTE_METADATA[attr].label}`);
        setUpgradingAttr(null);
        return;
      }

      setAttributes(updated);
      setSuccess(`${ATTRIBUTE_METADATA[attr].label} increased to ${updated[attr]}!`);
      setUpgradingAttr(null);
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess((current) => (current ? null : current));
      }, 3000);
    } catch (err) {
      setAttributes(prevAttributes);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setUpgradingAttr(null);
    }
  };

  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Character Attributes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 font-semibold">
              Core Stats
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Train and develop your core RPG disciplines. Attributes can never drop below 1.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-950/40 p-3 text-xs text-rose-300 border border-rose-500/40 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl bg-emerald-950/40 p-3 text-xs text-emerald-300 border border-emerald-500/40">
          {success}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VALID_ATTRIBUTES.map((attrKey) => {
          const meta = ATTRIBUTE_METADATA[attrKey];
          const currentValue = attributes[attrKey];
          const isUpgrading = upgradingAttr === attrKey;

          return (
            <div
              key={attrKey}
              className="group p-4 rounded-2xl bg-black/30 border border-rpg-surface-border hover:border-rpg-gold/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  <span className="text-2xl font-black tracking-tight text-rpg-gold font-mono">
                    {currentValue}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                  {meta.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-rpg-surface-border flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono">
                  Tier {currentValue}
                </span>
                <button
                  type="button"
                  onClick={() => handleIncrement(attrKey)}
                  disabled={upgradingAttr !== null}
                  className="px-3 py-1.5 rounded-xl bg-rpg-gold hover:brightness-110 text-rpg-void text-xs font-bold shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isUpgrading ? (
                    <span>Upgrading...</span>
                  ) : (
                    <>
                      <span>+1</span>
                      <span className="hidden xs:inline">Upgrade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
