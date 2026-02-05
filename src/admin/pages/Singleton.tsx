// src/admin/pages/Singleton.tsx
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { api } from "../lib/api";
import type { FieldDefinition } from "../types";
import { getFieldLabel } from "../types";
import { useSchemas } from "../App";
import { Heading, Alert, FormField, Button } from "../components/ui";
import { AlertCircle, Loader2 } from "lucide-react";

// Import editors
import StringEditor from "../editors/StringEditor";
import TextEditor from "../editors/TextEditor";
import NumberEditor from "../editors/NumberEditor";
import BooleanEditor from "../editors/BooleanEditor";
import RichtextEditor from "../editors/RichtextEditor";
import DatetimeEditor from "../editors/DatetimeEditor";
import SelectEditor from "../editors/SelectEditor";
import SlugEditor from "../editors/SlugEditor";
import ImageEditor from "../editors/ImageEditor";
import BlocksEditor from "../editors/BlocksEditor";

const editorMap: Record<
  string,
  React.ComponentType<{
    field: FieldDefinition;
    value: unknown;
    onChange: (v: unknown) => void;
    formData?: Record<string, unknown>;
  }>
> = {
  string: StringEditor,
  text: TextEditor,
  slug: SlugEditor,
  richtext: RichtextEditor,
  number: NumberEditor,
  boolean: BooleanEditor,
  datetime: DatetimeEditor,
  image: ImageEditor,
  select: SelectEditor,
  blocks: BlocksEditor,
};

export default function Singleton() {
  const params = useParams<{ schema: string }>();
  const { schemas } = useSchemas();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const schema = schemas.find(
    (s) => s.name === params.schema && s.type === "singleton",
  );

  useEffect(() => {
    if (!schema) return;

    setLoading(true);
    api
      .getSingleton(schema.name)
      .then((res) => {
        setData((res.data as Record<string, unknown>) || {});
      })
      .catch(() => {
        // Singleton might not exist yet, start with empty data
        setData({});
      })
      .finally(() => setLoading(false));
  }, [schema?.name]);

  const handleSave = async () => {
    if (!schema) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await api.updateSingleton(schema.name, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAF8]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FEF2F1] flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#DC4E42]" />
          </div>
          <p className="text-sm font-medium text-[#1A1A18]">Schema not found</p>
          <p className="text-xs text-[#9C9C91] mt-1">
            The requested singleton doesn't exist
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAF8]">
        <div className="flex items-center gap-2 text-[#9C9C91]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl bg-[#FAFAF8] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Heading>{schema.label}</Heading>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-6">
          Saved successfully
        </Alert>
      )}

      <div className="space-y-6">
        {schema.fields.map((field) => {
          const Editor = editorMap[field.type] || StringEditor;

          return (
            <FormField
              key={field.name}
              label={getFieldLabel(field)}
              required={field.required}
            >
              <Editor
                field={field}
                value={data[field.name]}
                onChange={(v) => setData({ ...data, [field.name]: v })}
                formData={data}
              />
            </FormField>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="mt-10 pt-6 border-t border-[#E8E8E3]">
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
