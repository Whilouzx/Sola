import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => <LabelPrimitive.Root ref={ref} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-medium opacity-100 text-[#4B5563FF]" {...props} />);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

