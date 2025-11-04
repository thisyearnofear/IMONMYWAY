# Challenge Templates Documentation

## Overview
Challenge templates are pre-defined challenge structures that users can select and participate in. They provide a framework for creating viral, entertaining, and engaging challenges that align with the IMONMYWAY platform's core mission of punctuality accountability.

## Core Concepts

### Template Structure
Each challenge template includes:
- **Name and Description**: Clear, engaging title and description
- **Category**: Adventure, Fitness, Social, Creative, Charity, or Viral
- **Difficulty Level**: Easy, Medium, Hard, or Extreme
- **Conditions**: Specific requirements for completion
- **Proof Requirements**: Evidence needed for verification
- **Rewards**: Token rewards, achievements, or multipliers
- **Viral Factor**: Scale from 1-10 indicating shareability potential

### Condition Types
- **Distance**: Specific distance requirements
- **Time**: Time-based completion requirements
- **Mode**: Transportation mode requirements (e.g., 30% by bicycle)
- **Proof**: Verification method requirements (GPS, photo, video)
- **Behavior**: Specific behavioral requirements (e.g., walk backwards)
- **Location**: Specific location requirements (checkpoints, destinations)

## Viral Challenge Examples

### London to France Eco Challenge
- **Concept**: Travel from London to France with specific conditions
- **Conditions**: 30% by bicycle, 20% on foot, complete within 12 hours
- **Verification**: GPS tracking, photo evidence
- **Viral Factor**: 8/10 - Highly shareable journey

### Lands End to John O'Groats Backwards
- **Concept**: Walk the entire length of Great Britain... backwards!
- **Conditions**: 50% of walking segments must be backwards, complete full route
- **Verification**: Video evidence of walking backwards, GPS tracking
- **Viral Factor**: 9/10 - Extremely entertaining content

### Zero Carbon Commute Challenge
- **Concept**: Commute to work with zero carbon emissions for a week
- **Conditions**: No private motor vehicle, 7 consecutive days
- **Verification**: GPS tracking, transport mode verification
- **Viral Factor**: 6/10 - Social impact focused

## Implementation Details

### Template System
The challenge template system is built with:
- Single source of truth in `src/lib/challenge-templates.ts`
- Modular, composable components
- Extensive type safety with TypeScript interfaces
- Easy extensibility for new challenge types

### Verification System
- Multiple verification methods (GPS, photo, video, AI, manual)
- Automated validation for objective conditions
- Manual review for complex behavioral requirements
- Blockchain integration for immutable proof

### UI Components
- Challenge browser with filtering and search
- Interactive challenge cards with expandable details
- Challenge creation flow with customizable parameters
- Progress tracking with real-time updates
- Viral challenge showcase on the main page

## Creating New Challenges

To create a new challenge template:
1. Add to the `CHALLENGE_TEMPLATES` array in `src/lib/challenge-templates.ts`
2. Define all conditions with appropriate verification methods
3. Set viral factor based on shareability potential
4. Include engaging proof requirements
5. Consider rewards and achievements

## Benefits

### User Engagement
- Pre-defined, engaging challenges reduce friction
- Viral potential creates organic growth
- Diverse challenge types appeal to different users
- Achievement system creates retention loops

### Platform Growth
- Viral challenges spread organically across social media
- Creative constraints encourage entertaining content
- Shareable achievements increase platform visibility
- Community-driven challenge creation possible

### Technical Implementation
- Modular design allows easy addition of new challenge types
- Consolidated verification logic ensures consistency
- Performance optimized for scalability
- Extensible architecture for future features