
export const ROLE_SPECIFIC_SKILLS = {
  'Textile Industry': {
    'Tailor': ['Pattern Making', 'Sewing', 'Measuring', 'Fabric Knowledge', 'Hand Stitching', 'Machine Operation'],
    'Cutters': ['Pattern Reading', 'Fabric Cutting', 'Precision Cutting', 'Tool Handling', 'Quality Control'],
    'Ironer': ['Pressing Techniques', 'Steam Ironing', 'Fabric Care', 'Quality Finishing'],
    'Washer': ['Fabric Treatment', 'Washing Techniques', 'Chemical Handling', 'Quality Control'],
    'Quality Control Inspector': ['Inspection', 'Quality Standards', 'Defect Detection', 'Documentation'],
    'Textile Dyeing Technician': ['Color Mixing', 'Dyeing Process', 'Chemical Handling', 'Quality Control'],
    'Textile Machine Maintenance Operator': ['Machine Maintenance', 'Troubleshooting', 'Mechanical Skills', 'Safety Protocols'],
    'Weaver/Knitter': ['Weaving', 'Knitting', 'Pattern Reading', 'Machine Operation'],
    'Textile Finisher': ['Finishing Techniques', 'Quality Control', 'Process Knowledge'],
    'Embroidery Operator': ['Embroidery', 'Design Reading', 'Machine Operation', 'Creativity']
  },
  'Warehousing Industry': {
    'Loader': ['Physical Strength', 'Loading Techniques', 'Safety Protocols', 'Team Work'],
    'Pickers': ['Order Picking', 'Inventory Management', 'Accuracy', 'Speed'],
    'Checkers': ['Quality Inspection', 'Documentation', 'Attention to Detail', 'Inventory Control'],
    'Shift Manager': ['Team Leadership', 'Planning', 'Communication', 'Problem Solving'],
    'Warehouse Manager': ['Management', 'Planning', 'Inventory Control', 'Team Leadership'],
    'Maintenance': ['Equipment Maintenance', 'Troubleshooting', 'Mechanical Skills', 'Safety']
  },
  'Hospitality': {
    'Chef': ['Cooking', 'Food Safety', 'Menu Planning', 'Kitchen Management', 'Creativity'],
    'Delivery Person': ['Navigation', 'Customer Service', 'Time Management', 'Vehicle Operation'],
    'Front Office Manager': ['Customer Service', 'Communication', 'Management', 'Problem Solving'],
    'Guest House Manager': ['Hospitality Management', 'Customer Service', 'Operations', 'Communication'],
    'Housekeeping': ['Cleaning', 'Attention to Detail', 'Time Management', 'Organization'],
    'Tour Expert': ['Local Knowledge', 'Communication', 'Customer Service', 'Planning'],
    'Multi-Purpose Worker': ['Flexibility', 'Basic Skills', 'Team Work', 'Adaptability'],
    'Beverage and Drink Specialist (Bartender)': ['Mixology', 'Customer Service', 'Communication', 'Creativity'],
    'Baker/Bakery Assistant': ['Baking', 'Food Safety', 'Creativity', 'Time Management']
  },
  'Manufacturing': {
    'Machine Operator': ['Machine Operation', 'Safety Protocols', 'Quality Control', 'Technical Skills'],
    'Production Line Worker': ['Assembly', 'Quality Control', 'Team Work', 'Efficiency'],
    'Welder': ['Welding', 'Safety Protocols', 'Technical Skills', 'Precision'],
    'Forklift Operator': ['Forklift Operation', 'Safety Protocols', 'Warehouse Skills', 'Navigation'],
    'Quality Control Inspector': ['Inspection', 'Quality Standards', 'Documentation', 'Attention to Detail'],
    'Maintenance Technician': ['Maintenance', 'Troubleshooting', 'Technical Skills', 'Safety'],
    'Assembly Line Worker': ['Assembly', 'Manual Dexterity', 'Quality Control', 'Team Work'],
    'CNC Machinist': ['CNC Programming', 'Machine Operation', 'Precision', 'Technical Skills'],
    'Industrial Electrician': ['Electrical Work', 'Safety Protocols', 'Troubleshooting', 'Technical Skills'],
    'Warehouse Associate': ['Inventory Management', 'Order Processing', 'Physical Strength', 'Organization'],
    'Packaging Technician': ['Packaging', 'Quality Control', 'Efficiency', 'Attention to Detail']
  },
  'Sales': {
    'Field Sales Executive': ['Sales Skills', 'Communication', 'Customer Relations', 'Negotiation'],
    'Cold Calling Executive': ['Cold Calling', 'Communication', 'Persistence', 'Sales Skills'],
    'Retail Store Salesperson': ['Customer Service', 'Product Knowledge', 'Sales Skills', 'Communication'],
    'FMCG Salesman': ['Sales Skills', 'Market Knowledge', 'Customer Relations', 'Product Knowledge'],
    'Telecaller (Telesales Agent)': ['Phone Skills', 'Communication', 'Sales Skills', 'Customer Service'],
    'Customer Service Sales': ['Customer Service', 'Problem Solving', 'Communication', 'Sales Skills']
  }
};

export const getRoleSkills = (industry: string, role: string): string[] => {
  const industrySkills = ROLE_SPECIFIC_SKILLS[industry as keyof typeof ROLE_SPECIFIC_SKILLS];
  if (industrySkills && industrySkills[role as keyof typeof industrySkills]) {
    return industrySkills[role as keyof typeof industrySkills];
  }
  return [];
};
