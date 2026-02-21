"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch("/api/account", { method: "DELETE" });
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 size={15} />
        Delete My Account
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirm("");
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-sm text-rose-700 font-medium mb-1">
              This will permanently delete:
            </p>
            <ul className="text-sm text-rose-600 list-disc list-inside space-y-0.5">
              <li>Your account and profile</li>
              <li>All snapshots and history</li>
              <li>All categories and line items</li>
            </ul>
          </div>

          <div>
            <label className="label-base">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="input-base"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={confirm !== "DELETE"}
              loading={loading}
              onClick={handleDelete}
            >
              Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
