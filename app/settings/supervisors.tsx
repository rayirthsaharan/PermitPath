import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Screen } from '../../src/components';
import { confirmAction, notify } from '../../src/components/settings/dialogs';
import { TextField } from '../../src/components/settings/TextField';
import { useStore } from '../../src/data/store';
import type { Supervisor } from '../../src/domain/types';
import { useTheme } from '../../src/theme/ThemeProvider';

type Editing = { id: string | null; name: string; relationship: string; attests21Plus: boolean };

const BLANK: Editing = { id: null, name: '', relationship: '', attests21Plus: false };

export default function Supervisors() {
  const { colors, spacing, typography } = useTheme();
  const supervisors = useStore((s) => s.supervisors);
  const drives = useStore((s) => s.drives);
  const addSupervisor = useStore((s) => s.addSupervisor);
  const updateSupervisor = useStore((s) => s.updateSupervisor);
  const removeSupervisor = useStore((s) => s.removeSupervisor);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = !!editing && editing.name.trim().length > 0 && editing.attests21Plus;

  const onSave = async () => {
    if (!editing || !valid) return;
    setSaving(true);
    try {
      const data = { name: editing.name.trim(), relationship: editing.relationship.trim(), attests21Plus: true };
      if (editing.id) await updateSupervisor(editing.id, data);
      else await addSupervisor(data);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (s: Supervisor) => {
    if (supervisors.length <= 1) {
      notify('Keep at least one supervisor', 'Every drive needs a supervising adult. Add another supervisor before removing this one.');
      return;
    }
    const used = drives.filter((d) => d.supervisorId === s.id).length;
    confirmAction({
      title: `Remove ${s.name}?`,
      message:
        used > 0
          ? `${s.name} is listed on ${used} logged drive${used === 1 ? '' : 's'}. Those drives will show "Unknown" as the supervisor. You can reassign them from the drive details.`
          : 'They will no longer appear when you start a drive.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => {
        void removeSupervisor(s.id);
        if (editing?.id === s.id) setEditing(null);
      },
    });
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Supervisors must be licensed drivers age 21 or older. They’re listed on the log you print.
      </Text>

      {supervisors.map((s) => (
        <Card key={s.id} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.headline, { color: colors.text }]}>{s.name}</Text>
              {s.relationship ? <Text style={[typography.caption, { color: colors.textMuted }]}>{s.relationship}</Text> : null}
            </View>
            {s.attests21Plus ? <Badge label="21+" tone="success" icon="checkmark" /> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Edit"
                variant="secondary"
                size="sm"
                accessibilityLabel={`Edit ${s.name}`}
                onPress={() => setEditing({ id: s.id, name: s.name, relationship: s.relationship, attests21Plus: s.attests21Plus })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Remove" variant="ghost" size="sm" accessibilityLabel={`Remove ${s.name}`} onPress={() => onRemove(s)} />
            </View>
          </View>
        </Card>
      ))}

      {editing ? (
        <Card style={{ gap: spacing.md }} accent={colors.primary}>
          <Text accessibilityRole="header" style={[typography.headline, { color: colors.text }]}>
            {editing.id ? 'Edit supervisor' : 'Add supervisor'}
          </Text>
          <TextField label="Name" value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} autoCapitalize="words" />
          <TextField
            label="Relationship"
            value={editing.relationship}
            onChangeText={(relationship) => setEditing({ ...editing, relationship })}
            placeholder="Parent, grandparent, aunt…"
            autoCapitalize="sentences"
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: editing.attests21Plus }}
            onPress={() => setEditing({ ...editing, attests21Plus: !editing.attests21Plus })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}
          >
            <Ionicons
              name={editing.attests21Plus ? 'checkbox' : 'square-outline'}
              size={28}
              color={editing.attests21Plus ? colors.primary : colors.textMuted}
            />
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>I am a licensed driver age 21 or older</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Save" loading={saving} disabled={!valid} onPress={() => void onSave()} />
            </View>
          </View>
        </Card>
      ) : (
        <Button label="+ Add supervisor" variant="secondary" onPress={() => setEditing(BLANK)} />
      )}
    </Screen>
  );
}
