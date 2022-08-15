
aad.portal.azure.com -> app registration -> New registration -> whatever name ->  single tenant ->  redirect url: http://localhost:8888/redirect -> register

app registration -> click on newly created app -> certificates & secrets -> New client secret -> whatever decription, expires -> what ever you like :) -> add


API permitions-> add permission ->  microsoft graph -> 

Calendars.Read
	
Place.Read.All

for next dev step -> add booking on site, write permission somewhere will be needed, probably ...


how to create rooms and roomlist:

admin.microsot.com

resources->add resource, room, email, name... etc

powershell:

Connect-ExchangeOnline

New-DistributionGroup -Name "Headquarters" -RoomList

Add-DistributionGroupMember -Identity "Headquarters" -Member mr1@domain.com

Add-DistributionGroupMember -Identity "Headquarters" -Member mr2@domain.com

Set-CalendarProcessing -Identity mr1@domain.com -DeleteSubject $False -AddOrganizerToSubject $False -RemovePrivateProperty $false

Set-CalendarProcessing -Identity mr2@domain.com -DeleteSubject $False -AddOrganizerToSubject $False -RemovePrivateProperty $false

....

controll cmd:

Get-Mailbox -ResultSize unlimited -Filter "RecipientTypeDetails -eq 'RoomMailbox'" | Get-CalendarProcessing | Format-List Identity,ScheduleOnlyDuringWorkHours,MaximumDurationInMinuteshistory

Get-CalendarProcessing -Identity mr1@domain.com|FL

IT TAKES HOURS FOR THIS TO WORKS OVER GRAPH!


remove:

Remove-DistributionGroup -identity "Headquarters"

remove resources in admin.microsoft.com


sources:

https://docs.microsoft.com/en-us/exchange/troubleshoot/client-connectivity/calendar-shows-organizer-name
