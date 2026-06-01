import { useState } from 'react';
import { Pressable, Text } from 'react-native';

const COLLAPSED_LINES = 4;

export interface ExpandableTextProps {
  text: string;
  testID?: string;
}

export function ExpandableText({ text, testID }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const longEnough = text.length > 160;

  return (
    <>
      <Text
        testID={testID}
        className="text-body text-neutral-800 dark:text-neutral-100"
        numberOfLines={expanded || !longEnough ? undefined : COLLAPSED_LINES}
      >
        {text}
      </Text>
      {longEnough ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          testID={testID ? `${testID}-toggle` : undefined}
          className="py-xs"
        >
          <Text className="text-caption font-medium text-accent-500">
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}
