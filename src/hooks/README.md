# useITIAutoFill Hook

This custom React hook automatically fills the "ITI Institute Name" field in role profiles for ITI-related roles using the user's associated organization data.

## Supported Roles

The hook automatically detects and fills the ITI Institute field for the following roles:
- **ITI (Other)**
- **Mechanic** 
- **Machine Operator**
- **Fitter**
- **Electrician**

## How It Works

1. **Role Detection**: Monitors the user's selected role (`profile.interestedRole`) or passed `role` prop
2. **Organization Check**: Verifies if the user has associated organizations from the `/organization/list/` API
3. **Smart Selection**: Prioritizes organizations with ITI-related keywords (ITI, institute, training, technical)
4. **Auto-fill**: Automatically populates the `itiInstitute` field in the `whatIHave` section
5. **Non-editable**: The ITI Institute field is automatically disabled (`ui:disabled: true`) for all ITI roles to prevent manual editing

## Usage

```typescript
import { useITIAutoFill } from '@/hooks/useITIAutoFill';

// In your component
const { profile, setProfile } = useProfileForm();

// Use the hook
useITIAutoFill({ profile, setProfile });

// Or pass a specific role
useITIAutoFill({ profile, setProfile, role: 'Mechanic' });
```

## Integration Points

The hook is integrated into:
1. **ProfileFormProvider**: Main profile form context provider
2. **DynamicFormStep**: Dynamic form rendering component
3. **WhatIHaveStep**: What I Have section component

## Dependencies

- `useAuth` hook from `@/contexts/AuthContext`
- User object with `organizations` array
- Profile object with `interestedRole` and `whatIHave.itiInstitute`

## Handled Edge Cases

1. **No Organizations**: Gracefully handles users without organization data
2. **Multiple Organizations**: Intelligently selects the most appropriate organization
3. **Already Filled**: Prevents overwriting existing ITI institute data
4. **Role Changes**: Re-triggers auto-fill when role changes
5. **Non-ITI Roles**: Skips auto-fill for non-ITI related roles

## Example API Response

The hook expects organization data in this format:
```json
[
  {
    "name": "Govt. ITI, Siddapur",
    "slug": "govt-iti-siddapur",
    "logo": null,
    "createdAt": "2025-08-08T18:30:14.590Z",
    "metadata": "{\"address\":\"Avaraguppa, UTTAR KANNAD, KARNATAKA\",\"code\":\"GR29001480\",\"contactPersonName\":\"Govt. ITI, Siddapur\",\"description\":\"\",\"originalType\":\"Govt.\",\"location\":\"Rural\",\"state\":\"KARNATAKA\",\"district\":\"UTTAR KANNAD\"}",
    "type": "employer",
    "id": "org_gr29001480"
  }
]
```

## Field Behavior

- **Auto-fill**: Automatically populated with organization name
- **Non-editable**: Field is disabled to prevent manual changes
- **Required**: Field remains required for form validation
- **Persistent**: Value persists across form steps and profile updates
