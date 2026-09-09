import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { ExerciseSchema } from './exercise.schema';

const EXERCISES = [
  {
    name: 'Left Bicep Curl',
    description: 'Curl your left arm up toward your shoulder and hold briefly.',
    instructions:
      'Stand or sit upright. Start with your arm fully extended downward. Curl your left forearm up toward your shoulder, hold for 1 second, then lower back down. That is one rep.',
    targetReps: 5,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Turn so your left side faces the camera. Your elbow and shoulder should be clearly visible.',
    angleChecks: [
      {
        label: 'Left elbow angle',
        a: 'leftShoulderPosition',
        b: 'leftElbowPosition',
        c: 'leftWristPosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftShoulderPosition',
        b: 'leftElbowPosition',
        c: 'leftWristPosition',
        targetAngle: 60,
        targetDirection: 'below',
        resetAngle: 150,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Curl your left arm up toward your shoulder',
      triggered: 'Good — hold it there',
      holding: 'Keep holding...',
      returning: 'Slowly lower your arm back down until it is fully extended',
    },
  },
  {
    name: 'Right Bicep Curl',
    description:
      'Curl your right arm up toward your shoulder and hold briefly.',
    instructions:
      'Stand or sit upright. Start with your arm fully extended downward. Curl your right forearm up toward your shoulder, hold for 1 second, then lower back down. That is one rep.',
    targetReps: 5,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Turn so your right side faces the camera. Your elbow and shoulder should be clearly visible.',
    angleChecks: [
      {
        label: 'Right elbow angle',
        a: 'rightShoulderPosition',
        b: 'rightElbowPosition',
        c: 'rightWristPosition',
      },
    ],
    repTriggers: [
      {
        a: 'rightShoulderPosition',
        b: 'rightElbowPosition',
        c: 'rightWristPosition',
        targetAngle: 60,
        targetDirection: 'below',
        resetAngle: 150,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Curl your right arm up toward your shoulder',
      triggered: 'Good — hold it there',
      holding: 'Keep holding...',
      returning: 'Slowly lower your arm back down until it is fully extended',
    },
  },
  {
    name: 'Left Knee Extension',
    description:
      'Strengthens the quadriceps by straightening the knee from a seated position.',
    instructions:
      'Sit upright in a chair with your feet flat on the floor. Slowly straighten your left leg out in front of you until it is fully extended, hold for 2 seconds, then lower back down.',
    targetReps: 8,
    holdSeconds: 2,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Sit sideways to the camera so your left hip, knee, and ankle are all visible.',
    angleChecks: [
      {
        label: 'Left knee angle',
        a: 'leftHipPosition',
        b: 'leftKneePosition',
        c: 'leftAnklePosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftHipPosition',
        b: 'leftKneePosition',
        c: 'leftAnklePosition',
        targetAngle: 165,
        targetDirection: 'above',
        resetAngle: 100,
        resetDirection: 'below',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Straighten your left leg out in front of you',
      triggered: 'Good — hold your leg straight',
      holding: 'Keep holding...',
      returning: 'Slowly lower your leg back down',
    },
  },
  {
    name: 'Right Knee Extension',
    description:
      'Strengthens the quadriceps by straightening the knee from a seated position.',
    instructions:
      'Sit upright in a chair with your feet flat on the floor. Slowly straighten your right leg out in front of you until it is fully extended, hold for 2 seconds, then lower back down.',
    targetReps: 8,
    holdSeconds: 2,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Sit sideways to the camera so your right hip, knee, and ankle are all visible.',
    angleChecks: [
      {
        label: 'Right knee angle',
        a: 'rightHipPosition',
        b: 'rightKneePosition',
        c: 'rightAnklePosition',
      },
    ],
    repTriggers: [
      {
        a: 'rightHipPosition',
        b: 'rightKneePosition',
        c: 'rightAnklePosition',
        targetAngle: 165,
        targetDirection: 'above',
        resetAngle: 100,
        resetDirection: 'below',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Straighten your right leg out in front of you',
      triggered: 'Good — hold your leg straight',
      holding: 'Keep holding...',
      returning: 'Slowly lower your leg back down',
    },
  },
  {
    name: 'Left Shoulder Abduction',
    description:
      'Raises the left arm out to the side to restore shoulder mobility.',
    instructions:
      'Stand upright with your arm resting at your side. Slowly raise your left arm out to the side until it reaches shoulder height, hold for 2 seconds, then lower back down.',
    targetReps: 8,
    holdSeconds: 2,
    cameraOrientation: 'front',
    cameraOrientationTip:
      'Face the camera directly so both shoulders and your left elbow are visible.',
    angleChecks: [
      {
        label: 'Left shoulder angle',
        a: 'leftHipPosition',
        b: 'leftShoulderPosition',
        c: 'leftElbowPosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftHipPosition',
        b: 'leftShoulderPosition',
        c: 'leftElbowPosition',
        targetAngle: 80,
        targetDirection: 'above',
        resetAngle: 30,
        resetDirection: 'below',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Raise your left arm out to the side',
      triggered: 'Good — hold it at shoulder height',
      holding: 'Keep holding...',
      returning: 'Slowly lower your arm back to your side',
    },
  },
  {
    name: 'Right Shoulder Abduction',
    description:
      'Raises the right arm out to the side to restore shoulder mobility.',
    instructions:
      'Stand upright with your arm resting at your side. Slowly raise your right arm out to the side until it reaches shoulder height, hold for 2 seconds, then lower back down.',
    targetReps: 8,
    holdSeconds: 2,
    cameraOrientation: 'front',
    cameraOrientationTip:
      'Face the camera directly so both shoulders and your right elbow are visible.',
    angleChecks: [
      {
        label: 'Right shoulder angle',
        a: 'rightHipPosition',
        b: 'rightShoulderPosition',
        c: 'rightElbowPosition',
      },
    ],
    repTriggers: [
      {
        a: 'rightHipPosition',
        b: 'rightShoulderPosition',
        c: 'rightElbowPosition',
        targetAngle: 80,
        targetDirection: 'above',
        resetAngle: 30,
        resetDirection: 'below',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Raise your right arm out to the side',
      triggered: 'Good — hold it at shoulder height',
      holding: 'Keep holding...',
      returning: 'Slowly lower your arm back to your side',
    },
  },
  {
    name: 'Left Hip Flexion',
    description:
      'Raises the left knee toward the chest to improve hip mobility and strength.',
    instructions:
      'Stand upright holding onto something stable if needed. Slowly raise your left knee up toward your chest, hold briefly, then lower back down.',
    targetReps: 6,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Turn so your left side faces the camera. Your shoulder, hip, and knee should be clearly visible.',
    angleChecks: [
      {
        label: 'Left hip angle',
        a: 'leftShoulderPosition',
        b: 'leftHipPosition',
        c: 'leftKneePosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftShoulderPosition',
        b: 'leftHipPosition',
        c: 'leftKneePosition',
        targetAngle: 100,
        targetDirection: 'below',
        resetAngle: 160,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Raise your left knee up toward your chest',
      triggered: 'Good — hold it there',
      holding: 'Keep holding...',
      returning: 'Slowly lower your leg back down',
    },
  },
  {
    name: 'Right Hip Flexion',
    description:
      'Raises the right knee toward the chest to improve hip mobility and strength.',
    instructions:
      'Stand upright holding onto something stable if needed. Slowly raise your right knee up toward your chest, hold briefly, then lower back down.',
    targetReps: 6,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Turn so your right side faces the camera. Your shoulder, hip, and knee should be clearly visible.',
    angleChecks: [
      {
        label: 'Right hip angle',
        a: 'rightShoulderPosition',
        b: 'rightHipPosition',
        c: 'rightKneePosition',
      },
    ],
    repTriggers: [
      {
        a: 'rightShoulderPosition',
        b: 'rightHipPosition',
        c: 'rightKneePosition',
        targetAngle: 100,
        targetDirection: 'below',
        resetAngle: 160,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Raise your right knee up toward your chest',
      triggered: 'Good — hold it there',
      holding: 'Keep holding...',
      returning: 'Slowly lower your leg back down',
    },
  },
  {
    name: 'Bodyweight Squat',
    description:
      'A compound movement that strengthens both legs together, bending at the hips and knees.',
    instructions:
      'Stand with feet shoulder-width apart. Slowly bend both knees and lower your hips as if sitting into a chair, hold briefly, then stand back up. Keep both legs moving together.',
    targetReps: 8,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Turn so your side faces the camera. Both hips, knees, and ankles should be visible in profile.',
    angleChecks: [
      {
        label: 'Left knee angle',
        a: 'leftHipPosition',
        b: 'leftKneePosition',
        c: 'leftAnklePosition',
      },
      {
        label: 'Right knee angle',
        a: 'rightHipPosition',
        b: 'rightKneePosition',
        c: 'rightAnklePosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftHipPosition',
        b: 'leftKneePosition',
        c: 'leftAnklePosition',
        targetAngle: 110,
        targetDirection: 'below',
        resetAngle: 160,
        resetDirection: 'above',
      },
      {
        a: 'rightHipPosition',
        b: 'rightKneePosition',
        c: 'rightAnklePosition',
        targetAngle: 110,
        targetDirection: 'below',
        resetAngle: 160,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Bend both knees and lower into a squat',
      triggered: 'Good — hold the squat',
      holding: 'Keep holding...',
      returning: 'Slowly stand back up until both legs are straight',
    },
  },
  {
    name: 'Left Ankle Pumps',
    description:
      'Improves ankle flexibility and circulation by flexing the foot up and down.',
    instructions:
      'Sit or lie down with your left leg extended. Slowly pull your foot upward toward your shin, hold briefly, then point it back down.',
    targetReps: 10,
    holdSeconds: 1,
    cameraOrientation: 'side',
    cameraOrientationTip:
      'Position the camera to clearly see your left knee, ankle, and foot from the side.',
    angleChecks: [
      {
        label: 'Left ankle angle',
        a: 'leftKneePosition',
        b: 'leftAnklePosition',
        c: 'leftFootIndexPosition',
      },
    ],
    repTriggers: [
      {
        a: 'leftKneePosition',
        b: 'leftAnklePosition',
        c: 'leftFootIndexPosition',
        targetAngle: 70,
        targetDirection: 'below',
        resetAngle: 110,
        resetDirection: 'above',
      },
    ],
    repTriggerCombinator: 'all',
    repStateInstructions: {
      rest: 'Pull your left foot upward toward your shin',
      triggered: 'Good — hold it there',
      holding: 'Keep holding...',
      returning: 'Slowly point your foot back down',
    },
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  const ExerciseModel = mongoose.model('Exercise', ExerciseSchema);

  for (const exercise of EXERCISES) {
    try {
      const result = await ExerciseModel.findOneAndUpdate(
        { name: exercise.name },
        exercise,
        {
          upsert: true,
          new: true,
          runValidators: true, // ← forces schema validation on upsert
          setDefaultsOnInsert: true,
        },
      );
      console.log(`✓ Seeded: ${result.name} (${result._id.toString()})`);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error(`✗ Failed: ${exercise.name} — ${errMessage}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
