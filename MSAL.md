
aad.portal.azure.com -> app registration -> New registration -> whatever name ->  single tenant ->  no redirect url -> register

Authentication -> add platorm -> web -> redirect: http://localhost:8888/redirect (do we need this? ....)

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

Add-DistributionGroupMember -Identity "Centrála" -Member mr1@domain.com

Add-DistributionGroupMember -Identity "Centrála" -Member mr2@domain.com

....

remove:

Remove-DistributionGroup -identity "Headquarters"

remove resources in admin.microsoft.com


